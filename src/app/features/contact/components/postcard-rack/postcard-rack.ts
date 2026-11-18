import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ApiStatus, api } from '@core/api';
import { DEFAULT_MESSAGE } from '@core/postcard';
import { FlipCard, FlipSide } from '@shared/ui/flip-card';
import { Icon } from '@shared/ui/icon';

interface RackCard {
  id: string;
  message: string;
  from: string;
  createdAt: number;
  imageUrl: string;
  /** The written side; null for cards sent before postcards had two sides. */
  backUrl: string | null;
}

/**
 * Postcards visitors sent in, pinned up after the owner approved them.
 * Clicking one opens it full size, where it can be turned over and the
 * visitor can step through the rest. Hidden until there is at least one
 * (and when there is no backend).
 */
@Component({
  selector: 'app-postcard-rack',
  imports: [DatePipe, FlipCard, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cards().length) {
      <h3>The postcard rack</h3>
      <p class="sub">Postcards visitors painted and sent in. Click one to read the back.</p>
      <ul>
        @for (c of cards(); track c.id; let i = $index) {
          <li [style.--tilt]="tilts[i % tilts.length] + 'deg'">
            <button type="button" class="pin" (click)="show(i)" [attr.aria-label]="'Open the postcard from ' + c.from">
              <img [src]="c.imageUrl" alt="" loading="lazy" width="320" height="200" />
              <span class="msg">“{{ c.message || defaultMessage }}”</span>
              <span class="from">— {{ c.from }} · {{ c.createdAt | date: 'mediumDate' }}</span>
            </button>
          </li>
        }
      </ul>
    }

    <dialog #viewer aria-labelledby="rack-viewer-title" (close)="open.set(null)" (click)="onBackdrop($event)" (keydown)="onKey($event)">
      @if (current(); as c) {
        <div class="sheet">
          <header>
            <h2 id="rack-viewer-title">Postcard from {{ c.from }}</h2>
            <span class="count">{{ (open() ?? 0) + 1 }} of {{ cards().length }}</span>
            <button type="button" class="round close" (click)="viewer.close()" aria-label="Close">
              <app-icon name="close" />
            </button>
          </header>

          <app-flip-card
            [front]="c.imageUrl"
            [back]="c.backUrl"
            [side]="side()"
            (sideChange)="side.set($event)"
            [alt]="'Postcard from ' + c.from"
          />

          <div class="meta">
            <p class="msg big">“{{ c.message || defaultMessage }}”</p>
            <p class="from">— {{ c.from }} · {{ c.createdAt | date: 'longDate' }}</p>
          </div>

          <footer>
            <button type="button" class="round" (click)="step(-1)" [disabled]="cards().length < 2" aria-label="Previous postcard">
              <app-icon name="arrow-left" />
            </button>
            @if (c.backUrl) {
              <button type="button" class="btn btn-ghost" (click)="side.set(side() === 'front' ? 'back' : 'front')">
                <app-icon name="flip" /> Turn over
              </button>
            }
            <button type="button" class="round" (click)="step(1)" [disabled]="cards().length < 2" aria-label="Next postcard">
              <app-icon name="arrow" />
            </button>
          </footer>
        </div>
      }
    </dialog>
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
      transform: rotate(var(--tilt, 0deg));
      transition: transform 0.3s var(--ease);
    }
    li:hover,
    li:focus-within {
      transform: rotate(0deg) translateY(-3px);
    }
    .pin {
      display: grid;
      gap: 6px;
      width: 100%;
      padding: 10px 10px 14px;
      background: var(--paper);
      color: var(--ink);
      border: 2px solid var(--ink);
      border-radius: 6px;
      box-shadow: 5px 5px 0 var(--ink);
      font: inherit;
      text-align: left;
      cursor: zoom-in;
    }
    .pin:focus-visible {
      outline: 3px solid var(--accent, var(--ink));
      outline-offset: 4px;
    }
    .pin img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      border: 1.5px solid var(--ink);
      border-radius: 3px;
    }
    .msg {
      font-family: var(--font-hand, 'Caveat', cursive);
      font-size: 1.35rem;
      line-height: 1.2;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    .pin .msg {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .from {
      color: var(--muted);
      font-size: 0.85rem;
    }
    dialog {
      width: min(900px, calc(100vw - 32px));
      max-height: calc(100dvh - 32px);
      padding: 0;
      border: 2px solid var(--ink);
      border-radius: var(--radius-lg, 18px);
      background: var(--paper);
      color: var(--ink);
      box-shadow: 8px 8px 0 var(--ink);
      overflow: auto;
    }
    dialog::backdrop {
      background: color-mix(in srgb, var(--ink) 45%, transparent);
    }
    .sheet {
      display: grid;
      gap: 16px;
      padding: clamp(16px, 3vw, 24px);
    }
    header,
    footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    header h2 {
      flex: 1;
      margin: 0;
      font-size: 1.4rem;
      overflow-wrap: anywhere;
    }
    .count {
      color: var(--muted);
      font-size: 0.85rem;
      white-space: nowrap;
    }
    footer {
      justify-content: center;
    }
    .round {
      display: grid;
      place-items: center;
      flex: none;
      width: 42px;
      height: 42px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: transparent;
      color: var(--ink);
      cursor: pointer;
    }
    .round:disabled {
      opacity: 0.35;
      cursor: default;
    }
    .meta p {
      margin: 0;
    }
    .msg.big {
      font-size: 1.7rem;
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
  protected readonly defaultMessage = DEFAULT_MESSAGE;
  /** Index of the card open in the viewer, or null. */
  protected readonly open = signal<number | null>(null);
  protected readonly side = signal<FlipSide>('front');
  protected readonly current = computed(() => {
    const i = this.open();
    return i === null ? null : (this.cards()[i] ?? null);
  });
  private readonly viewer = viewChild.required<ElementRef<HTMLDialogElement>>('viewer');
  private readonly injector = inject(Injector);

  constructor() {
    if (inject(ApiStatus).available()) void this.load();
  }

  protected show(i: number): void {
    this.open.set(i);
    this.side.set('front');
    const el = this.viewer().nativeElement;
    if (el.open) return;
    el.showModal();
    // The card is drawn on the next render; focus its close button rather than the bare dialog.
    afterNextRender(() => el.querySelector<HTMLElement>('.close')?.focus(), { injector: this.injector });
  }

  /** Previous / next card, wrapping around. */
  protected step(by: number): void {
    const n = this.cards().length;
    if (n < 2) return;
    this.open.update((i) => ((i ?? 0) + by + n) % n);
    this.side.set('front');
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') this.step(-1);
    else if (e.key === 'ArrowRight') this.step(1);
    else return;
    e.preventDefault();
  }

  /** Clicking the dimmed backdrop closes the viewer. */
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.viewer().nativeElement) this.viewer().nativeElement.close();
  }

  private async load(): Promise<void> {
    const res = await api<RackCard[]>('/postcards');
    if (res.ok && Array.isArray(res.data)) this.cards.set(res.data);
  }
}
