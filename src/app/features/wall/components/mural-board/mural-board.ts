import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Celebration } from '@core/celebration';
import { MURAL_BACKEND, MuralClaim } from '@core/mural-store';
import { PaintState } from '@core/paint-state';
import { ArtShape } from '@shared/art/art';
import { MURAL } from '@shared/art/mural';
import { Reveal } from '@shared/directives/reveal.directive';
import { PostcardSource } from '@shared/directives/postcard-source.directive';
import { Icon } from '@shared/ui/icon';
import { MuralCanvas } from '../mural-canvas/mural-canvas';
import { RecentArtists } from '../recent-artists/recent-artists';
import { SignForm, Signature } from '../sign-form/sign-form';
import { readFlag, writeFlag } from '../signed-flag';

const SIGNED_KEY = 'ink-pigment:mural-signed';

/**
 * Community mural: every visitor paints exactly one shape of a shared city
 * scene and signs it. Over time visitors colour the whole mural together.
 */
@Component({
  selector: 'app-mural-board',
  imports: [MuralCanvas, RecentArtists, SignForm, Reveal, Icon, PostcardSource],
  templateUrl: './mural-board.html',
  styleUrl: '../board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuralBoard {
  protected readonly state = inject(PaintState);
  private readonly backend = inject(MURAL_BACKEND);
  private readonly celebration = inject(Celebration);

  protected readonly art = MURAL;
  protected readonly total = MURAL.shapes.length;

  protected readonly claims = signal<MuralClaim[]>([]);
  protected readonly pending = signal<ArtShape | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly signedRegion = signal<string | null>(readFlag(SIGNED_KEY));
  /** Visitor is changing their own shape (colour previews live from the dock). */
  protected readonly editing = signal(false);

  /** regionId → claim, with the visitor's shape recoloured live while editing. */
  protected readonly claimMap = computed(() => {
    const map = new Map(this.claims().map((c) => [c.regionId, c]));
    const id = this.signedRegion();
    const mine = id ? map.get(id) : undefined;
    if (this.editing() && mine) map.set(mine.regionId, { ...mine, color: this.state.activeColor().hex });
    return map;
  });

  protected readonly mine = computed(() => {
    const id = this.signedRegion();
    return id ? (this.claims().find((c) => c.regionId === id) ?? null) : null;
  });
  protected readonly mineLabel = computed(() => {
    const id = this.signedRegion();
    return MURAL.shapes.find((s) => s.id === id)?.label ?? 'a shape';
  });
  protected readonly percent = computed(() =>
    Math.round((this.claims().length / this.total) * 100),
  );

  private readonly canvas = viewChild.required(MuralCanvas, { read: ElementRef });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.claims.set(await this.backend.list());
  }

  protected onPick(shape: ArtShape): void {
    this.error.set('');
    this.pending.set(shape);
  }

  protected async sign(sig: Signature): Promise<void> {
    const shape = this.pending();
    if (!shape || this.saving() || this.signedRegion()) return;
    this.saving.set(true);
    this.error.set('');
    const colour = this.state.activeColor();
    const claim: MuralClaim = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      regionId: shape.id,
      color: colour.hex,
      name: sig.name,
      place: sig.place,
      createdAt: Date.now(),
    };
    try {
      const result = await this.backend.claim(claim);
      await this.load();
      if (!result.ok) {
        this.error.set(result.reason);
        this.pending.set(null);
        return;
      }
      writeFlag(SIGNED_KEY, shape.id);
      this.signedRegion.set(shape.id);
      this.pending.set(null);
      this.celebration.celebrate({
        title: "You're on the mural!",
        detail: `${shape.label} is now ${colour.name}. Thanks for painting.`,
        el: this.canvas().nativeElement,
      });
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveEdit(sig: Signature): Promise<void> {
    const mine = this.mine();
    if (!mine || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const result = await this.backend.update({
        ...mine,
        color: this.state.activeColor().hex,
        name: sig.name,
        place: sig.place,
      });
      await this.load();
      if (!result.ok) {
        this.error.set(result.reason);
        return;
      }
      this.editing.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
