import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { CardPaper, DEFAULT_MESSAGE, MAX_FROM, MAX_MESSAGE, MAX_MESSAGE_LINES, Postcard } from '@core/postcard';
import { FlipCard } from '@shared/ui/flip-card';
import { Icon } from '@shared/ui/icon';

/**
 * Postcard preview: a two-sided card the visitor can turn over, write on,
 * sign, and style (paper and stamp colour), then download, share or send.
 */
@Component({
  selector: 'app-postcard-dialog',
  imports: [FlipCard, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog aria-labelledby="postcard-title" (close)="postcard.close()" (click)="onBackdrop($event)">
      <div class="sheet">
        <header>
          <h2 id="postcard-title">Your postcard</h2>
          <button type="button" class="x" (click)="dialog.close()" aria-label="Close">
            <app-icon name="close" />
          </button>
        </header>

        <div class="preview">
          <app-flip-card
            [front]="postcard.frontUrl()"
            [back]="postcard.backUrl()"
            [side]="postcard.side()"
            (sideChange)="postcard.side.set($event)"
            alt="Your postcard"
          />
          <div class="sides" role="group" aria-label="Side shown">
            <button type="button" [attr.aria-pressed]="postcard.side() === 'front'" (click)="postcard.side.set('front')">
              Front
            </button>
            <button type="button" [attr.aria-pressed]="postcard.side() === 'back'" (click)="postcard.side.set('back')">
              Back
            </button>
            <span class="tip">Click the card to turn it over</span>
          </div>
        </div>

        <div class="fields">
          <label class="message">
            <span class="label">Message</span>
            <textarea
              #msg
              rows="3"
              [maxLength]="maxMessage"
              [placeholder]="defaultMessage"
              [value]="postcard.message()"
              (focus)="postcard.side.set('back')"
              (input)="onMessage(msg)"
            ></textarea>
            <span class="count" [class.near]="remaining() <= 15" aria-live="polite">
              {{ remaining() }} characters left · up to {{ maxLines }} lines
            </span>
          </label>

          <label>
            <span class="label">From</span>
            <input
              #from
              type="text"
              [maxLength]="maxFrom"
              placeholder="a visitor"
              autocomplete="nickname"
              [value]="postcard.from()"
              (focus)="postcard.side.set('back')"
              (input)="postcard.from.set(from.value); redraw()"
            />
          </label>

          <div class="choice">
            <span class="label" id="paper-label">Paper</span>
            <div class="toggle" role="radiogroup" aria-labelledby="paper-label">
              @for (p of papers; track p.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="postcard.paper() === p.id"
                  (click)="postcard.setPaper(p.id)"
                >
                  <span class="chip" [class]="p.id"></span>{{ p.label }}
                </button>
              }
            </div>
          </div>

          <div class="choice stamps">
            <span class="label" id="stamp-label">Stamp</span>
            <div class="swatches" role="radiogroup" aria-labelledby="stamp-label">
              @for (c of postcard.stampColours(); track c.hex) {
                <button
                  type="button"
                  class="swatch"
                  role="radio"
                  [attr.aria-checked]="c.hex.toUpperCase() === postcard.stamp()"
                  [attr.aria-label]="c.name"
                  [title]="c.name"
                  [style.background]="c.hex"
                  (click)="postcard.setStamp(c.hex)"
                ></button>
              }
              <label class="swatch custom" title="Any colour">
                <app-icon name="palette" />
                <span class="sr-only">Any colour</span>
                <input #pick type="color" [value]="postcard.stamp()" (input)="postcard.setStamp(pick.value)" />
              </label>
            </div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn" (click)="postcard.download()" [disabled]="!postcard.ready()">
            <app-icon name="download" /> Download both sides
          </button>
          @if (postcard.canSend()) {
            <button
              type="button"
              class="btn btn-ghost"
              (click)="postcard.send()"
              [disabled]="!postcard.ready() || postcard.sending()"
            >
              <app-icon name="mail" />
              {{ postcard.sending() ? 'Sending…' : 'Send it to ' + (postcard.ownerName() || 'the studio') }}
            </button>
          }
          @if (postcard.canShare()) {
            <button type="button" class="btn btn-ghost" (click)="postcard.share()">
              <app-icon name="share" /> Share
            </button>
          }
        </div>
        @if (postcard.sendError()) {
          <p class="error" role="alert">{{ postcard.sendError() }}</p>
        }
        <p class="note">
          @if (postcard.canSend()) {
            Download keeps it on your device. A card you send is only seen by
            {{ postcard.ownerName() || 'the owner' }} until it's approved for the postcard rack.
          } @else {
            Your postcard is saved to your device — nothing is sent anywhere.
          }
        </p>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(820px, calc(100vw - 32px));
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
      gap: 18px;
      padding: clamp(16px, 3vw, 24px);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h2 {
      font-size: 1.5rem;
      margin: 0;
    }
    .x {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: transparent;
      color: var(--ink);
      cursor: pointer;
    }
    .preview {
      display: grid;
      gap: 10px;
    }
    .sides {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .sides button,
    .toggle button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 14px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      background: transparent;
      color: var(--ink);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .sides button[aria-pressed='true'],
    .toggle button[aria-checked='true'] {
      background: var(--ink);
      color: var(--paper);
    }
    .tip {
      margin-left: auto;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 16px;
      align-items: start;
    }
    .message {
      grid-column: 1 / -1;
    }
    label,
    .choice {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    input[type='text'],
    textarea {
      padding: 10px 14px;
      border: 2px solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      color: var(--ink);
      font: inherit;
      min-width: 0;
    }
    input[type='text'] {
      height: 46px;
    }
    textarea {
      resize: vertical;
      min-height: 92px;
      line-height: 1.4;
    }
    .count {
      justify-self: end;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .count.near {
      color: var(--ink);
      font-weight: 700;
    }
    .toggle {
      display: flex;
      gap: 8px;
    }
    .chip {
      width: 16px;
      height: 16px;
      border: 2px solid #8a857a;
      border-radius: 50%;
    }
    .chip.light {
      background: #f6f2e9;
    }
    .chip.dark {
      background: #141412;
    }
    .stamps {
      grid-column: 1 / -1;
    }
    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      position: relative;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 2px solid var(--ink);
      border-radius: 6px;
      cursor: pointer;
    }
    .swatch[aria-checked='true'] {
      outline: 2px solid var(--ink);
      outline-offset: 3px;
    }
    .swatch:focus-visible {
      outline: 3px solid var(--accent, var(--ink));
      outline-offset: 3px;
    }
    .custom {
      display: grid;
      place-items: center;
      background: var(--paper);
      color: var(--ink);
      font-size: 0.8rem;
    }
    .custom input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .error {
      margin: 0;
      padding: 10px 14px;
      border-radius: 10px;
      background: #c0392b;
      color: #fff;
      font-size: 0.9rem;
    }
    .note {
      margin: 0;
      color: var(--muted);
      font-size: 0.85rem;
    }
    @media (max-width: 600px) {
      .fields {
        grid-template-columns: 1fr;
      }
      .tip {
        display: none;
      }
    }
  `,
})
export class PostcardDialog {
  protected readonly postcard = inject(Postcard);
  protected readonly maxMessage = MAX_MESSAGE;
  protected readonly maxLines = MAX_MESSAGE_LINES;
  protected readonly maxFrom = MAX_FROM;
  protected readonly defaultMessage = DEFAULT_MESSAGE;
  protected readonly papers: { id: CardPaper; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const open = this.postcard.isOpen();
      const el = this.dialog().nativeElement;
      if (open && !el.open) el.showModal();
      if (!open && el.open) el.close();
    });
  }

  protected remaining(): number {
    return MAX_MESSAGE - this.postcard.message().length;
  }

  /** Applies the length and line limits, keeping the cursor where it was. */
  protected onMessage(el: HTMLTextAreaElement): void {
    const clean = this.postcard.setMessage(el.value);
    if (clean !== el.value) {
      const at = Math.min(el.selectionStart, clean.length);
      el.value = clean;
      el.setSelectionRange(at, at);
    }
    this.redraw();
  }

  /** Redraws the back shortly after typing stops. */
  protected redraw(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.postcard.render('back'), 250);
  }

  /** Clicking the dimmed backdrop closes the preview. */
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
