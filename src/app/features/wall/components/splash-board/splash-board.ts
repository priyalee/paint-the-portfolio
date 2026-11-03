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
import { PaintState } from '@core/paint-state';
import { SPLASH_BACKEND, SPLASH_SIZE, SPLASH_WALL, Splash } from '@core/splash-store';
import { Reveal } from '@shared/directives/reveal.directive';
import { PostcardSource } from '@shared/directives/postcard-source.directive';
import { Icon } from '@shared/ui/icon';
import { RecentArtists } from '../recent-artists/recent-artists';
import { SignForm, Signature } from '../sign-form/sign-form';
import { PendingSplash, SplashCanvas } from '../splash-canvas/splash-canvas';
import { readFlag, writeFlag } from '../signed-flag';

const SIGNED_KEY = 'ink-pigment:splash-signed';
/** Keeps splashes (and their droplets) mostly on the wall. */
const MARGIN = 80;

/**
 * Splash wall: each visitor throws one splash of paint anywhere on a brick
 * wall and signs it. Splashes overlap freely, so the wall gets messier (and
 * better) the more people visit.
 */
@Component({
  selector: 'app-splash-board',
  imports: [SplashCanvas, RecentArtists, SignForm, Reveal, Icon, PostcardSource],
  templateUrl: './splash-board.html',
  styleUrl: '../board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashBoard {
  protected readonly state = inject(PaintState);
  private readonly backend = inject(SPLASH_BACKEND);
  private readonly celebration = inject(Celebration);

  protected readonly splashes = signal<Splash[]>([]);
  /** Visitor is changing their own splash (colour previews live from the dock). */
  protected readonly editing = signal(false);
  /** What the wall shows: the visitor's splash recoloured live while editing. */
  protected readonly shown = computed(() => {
    const id = this.signedId();
    const colour = this.state.activeColor().hex;
    return this.editing()
      ? this.splashes().map((s) => (s.id === id ? { ...s, color: colour } : s))
      : this.splashes();
  });
  protected readonly pending = signal<PendingSplash | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly signedId = signal<string | null>(readFlag(SIGNED_KEY));

  protected readonly mine = computed(() => {
    const id = this.signedId();
    return id ? (this.splashes().find((s) => s.id === id) ?? null) : null;
  });

  private readonly canvas = viewChild.required(SplashCanvas, { read: ElementRef });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.splashes.set(await this.backend.list());
  }

  /** Throws (or re-throws) the pending splash at a point on the wall. */
  protected throwAt(point: { x: number; y: number }): void {
    if (this.signedId()) return;
    this.error.set('');
    this.pending.set({
      x: Math.round(clamp(point.x, MARGIN, SPLASH_WALL.width - MARGIN)),
      y: Math.round(clamp(point.y, MARGIN, SPLASH_WALL.height - MARGIN)),
      seed: Math.floor(Math.random() * 2 ** 31),
      size: Math.round(SPLASH_SIZE.min + Math.random() * (SPLASH_SIZE.max - SPLASH_SIZE.min)),
    });
  }

  /** Keyboard-friendly way to throw: a random spot on the wall. */
  protected throwRandom(): void {
    this.throwAt({
      x: Math.random() * SPLASH_WALL.width,
      y: Math.random() * SPLASH_WALL.height,
    });
  }

  protected async sign(sig: Signature): Promise<void> {
    const p = this.pending();
    if (!p || this.saving() || this.signedId()) return;
    this.saving.set(true);
    this.error.set('');
    const colour = this.state.activeColor();
    const splash: Splash = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      ...p,
      color: colour.hex,
      name: sig.name,
      place: sig.place,
      createdAt: Date.now(),
    };
    try {
      const result = await this.backend.add(splash);
      if (!result.ok) {
        this.error.set(result.reason);
        return;
      }
      await this.load();
      writeFlag(SIGNED_KEY, splash.id);
      this.signedId.set(splash.id);
      this.pending.set(null);
      this.celebration.celebrate({
        title: 'Splat! You made your mark',
        detail: `Your ${colour.name} splash is on the wall. Thanks for stopping by.`,
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

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
