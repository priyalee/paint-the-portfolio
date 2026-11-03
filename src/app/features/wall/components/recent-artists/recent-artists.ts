import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Anything with a painter: name, colour, time (and optional place). */
export interface Artist {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  place?: string;
}

/** Chips with the names (and colours) of the latest wall signers. */
@Component({
  selector: 'app-recent-artists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (recent().length) {
      <h4>Recent painters</h4>
      <ul>
        @for (m of recent(); track m.id) {
          <li [title]="m.place || ''"><span class="dot" [style.background]="m.color"></span>{{ m.name }}</li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    h4 {
      font-family: var(--font-body);
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px 4px 6px;
      border: 1.5px solid var(--ink);
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .dot {
      width: 14px;
      height: 14px;
      margin-right: 6px;
      border: 2px solid var(--ink);
      border-radius: 50%;
    }
  `,
})
export class RecentArtists {
  readonly marks = input<Artist[]>([]);
  readonly limit = input(8);
  protected readonly recent = computed(() =>
    [...this.marks()].sort((a, b) => b.createdAt - a.createdAt).slice(0, this.limit()),
  );
}
