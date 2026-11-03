import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { PaintState } from '@core/paint-state';
import { Artwork } from '@shared/art/art';
import { Icon } from '@shared/ui/icon';

/** List of colouring pages with per-page progress. */
@Component({
  selector: 'app-artwork-picker',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', 'aria-label': 'Colouring pages' },
  template: `
    @for (a of artworks(); track a.id) {
      <button
        type="button"
        class="page"
        [class.active]="a.id === selected()"
        [attr.aria-current]="a.id === selected()"
        (click)="selected.set(a.id)"
      >
        <span class="title">{{ a.title }}</span>
        <span class="count">
          @if (isDone(a.id)) {
            <app-icon name="check" /> done
          } @else {
            {{ progress(a.id) }}
          }
        </span>
      </button>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 10px;
      position: sticky;
      top: calc(var(--nav-h) + 20px);
    }
    .page {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 2px solid var(--ink);
      border-radius: var(--radius);
      background: var(--paper);
      text-align: left;
      cursor: pointer;
      transition:
        transform 0.2s var(--ease),
        box-shadow 0.2s;
    }
    .page:hover {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 var(--ink);
    }
    .page.active {
      background: var(--ink);
      color: var(--paper);
    }
    .title {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 1.1rem;
    }
    .count {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.75;
    }
    @media (max-width: 820px) {
      :host {
        position: static;
        grid-auto-flow: column;
        grid-auto-columns: minmax(160px, 1fr);
        overflow-x: auto;
      }
    }
  `,
})
export class ArtworkPicker {
  readonly artworks = input.required<Artwork[]>();
  readonly selected = model.required<string>();

  private readonly state = inject(PaintState);

  protected progress(id: string): string {
    const p = this.state.progressFor('studio', id + ':');
    return p.total ? `${p.painted}/${p.total}` : 'new';
  }

  protected isDone(id: string): boolean {
    const p = this.state.progressFor('studio', id + ':');
    return p.total > 0 && p.painted === p.total;
  }
}
