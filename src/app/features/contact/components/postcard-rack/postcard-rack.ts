import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiStatus, api } from '@core/api';

interface RackCard {
  id: string;
  message: string;
  from: string;
  createdAt: number;
  imageUrl: string;
}

/**
 * Postcards visitors sent in, pinned up after the owner approved them.
 * Hidden entirely until there is at least one (and when there is no backend).
 */
@Component({
  selector: 'app-postcard-rack',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cards().length) {
      <h3>The postcard rack</h3>
      <p class="sub">Postcards visitors painted and sent in.</p>
      <ul>
        @for (c of cards(); track c.id; let i = $index) {
          <li [style.--tilt]="tilts[i % tilts.length] + 'deg'">
            <img [src]="c.imageUrl" [alt]="'Postcard from ' + c.from" loading="lazy" width="320" height="200" />
            <p class="msg">“{{ c.message || 'Wish you were here!' }}”</p>
            <p class="from">— {{ c.from }} · {{ c.createdAt | date: 'mediumDate' }}</p>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    h3 {
      font-size: 1.6rem;
      margin: 0;
    }
    .sub {
      margin: 4px 0 20px;
      color: var(--muted);
    }
    ul {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
      gap: 24px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: grid;
      gap: 6px;
      padding: 10px 10px 14px;
      background: var(--paper);
      border: 2px solid var(--ink);
      border-radius: 6px;
      box-shadow: 5px 5px 0 var(--ink);
      transform: rotate(var(--tilt, 0deg));
      transition: transform 0.3s var(--ease);
    }
    li:hover {
      transform: rotate(0deg) translateY(-3px);
    }
    img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      border: 1.5px solid var(--ink);
      border-radius: 3px;
    }
    p {
      margin: 0;
    }
    .msg {
      font-family: var(--font-hand, 'Caveat', cursive);
      font-size: 1.35rem;
      line-height: 1.2;
    }
    .from {
      color: var(--muted);
      font-size: 0.85rem;
    }
    @media (hover: none) {
      li:hover {
        transform: rotate(var(--tilt, 0deg));
      }
    }
  `,
})
export class PostcardRack {
  protected readonly cards = signal<RackCard[]>([]);
  protected readonly tilts = [-1.5, 1, -0.6, 1.4, -1.1, 0.7];

  constructor() {
    if (inject(ApiStatus).available()) void this.load();
  }

  private async load(): Promise<void> {
    const res = await api<RackCard[]>('/postcards');
    if (res.ok) this.cards.set(res.data);
  }
}
