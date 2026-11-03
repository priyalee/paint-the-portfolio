import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { PaintState } from '@core/paint-state';
import { Postcard } from '@core/postcard';
import { canvasToBlob, cssVar, downloadBlob } from '@core/snapshot';
import { Artwork } from '@shared/art/art';
import { ArtCanvas } from '@shared/paint/art-canvas';
import { PaintBlock } from '@shared/paint/paint-block.directive';
import { Icon } from '@shared/ui/icon';

/** The colouring surface: progress meter, the artwork, start-over and download. */
@Component({
  selector: 'app-easel',
  imports: [ArtCanvas, PaintBlock, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = art();
    <div class="card easel" [appPaintBlock]="a.id + ':'" [blockTitle]="a.title" scope="studio">
      <div class="head">
        <div class="meter" role="progressbar" [attr.aria-valuenow]="percent()" aria-valuemin="0" aria-valuemax="100">
          <span [style.width.%]="percent()"></span>
        </div>
        <span class="pct">{{ percent() }}%</span>
      </div>

      <!-- @for with a single item re-creates the canvas when the artwork changes -->
      @for (x of [a]; track x.id) {
        <app-art [art]="x" scope="studio" [prefix]="x.id + ':'" class="canvas" />
      }

      <div class="actions">
        <button type="button" class="btn btn-ghost" (click)="state.reset('studio', a.id + ':')">
          <app-icon name="reset" /> Start over
        </button>
        <button type="button" class="btn" (click)="download()">
          <app-icon name="download" /> Download PNG
        </button>
      </div>
    </div>
  `,
  styles: `
    .easel {
      padding: clamp(14px, 3vw, 28px);
    }
    .head {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }
    .meter {
      flex: 1;
      height: 12px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      overflow: hidden;
    }
    .meter span {
      display: block;
      height: 100%;
      background: var(--accent);
      transition: width 0.5s var(--ease);
    }
    .pct {
      font-weight: 700;
      min-width: 3.5ch;
      text-align: right;
    }
    .canvas {
      --sw: 1.6;
      max-width: 640px;
      margin: 0 auto;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `,
})
export class Easel {
  readonly art = input.required<Artwork>();

  protected readonly state = inject(PaintState);
  private readonly canvas = viewChild.required(ArtCanvas);

  protected readonly percent = computed(() =>
    Math.round(this.state.progressFor('studio', this.art().id + ':').ratio * 100),
  );

  constructor() {
    inject(DestroyRef).onDestroy(
      inject(Postcard).register({
        id: 'studio',
        order: 0,
        snapshot: () => this.canvas().snapshot(),
      }),
    );
  }

  protected async download(): Promise<void> {
    const img = await this.canvas().snapshot(3);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = cssVar('--paper');
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    downloadBlob(await canvasToBlob(c), `${this.art().id}-painting.png`);
  }
}
