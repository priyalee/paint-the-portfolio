import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAX_FROM, MAX_MESSAGE, Postcard } from '@core/postcard';
import { Icon } from '@shared/ui/icon';

/**
 * Postcard preview: shows the card, lets the visitor write a short message
 * and sign it, then download it (or share it from a phone).
 */
@Component({
  selector: 'app-postcard-dialog',
  imports: [FormsModule, Icon],
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
          @if (postcard.previewUrl(); as url) {
            <img [src]="url" alt="Preview of your postcard" />
          } @else {
            <p>Printing…</p>
          }
        </div>

        <div class="fields">
          <label>
            <span>Message</span>
            <input
              type="text"
              [maxlength]="maxMessage"
              placeholder="Wish you were here!"
              [ngModel]="postcard.message()"
              (ngModelChange)="postcard.message.set($event); redraw()"
            />
          </label>
          <label>
            <span>From</span>
            <input
              type="text"
              [maxlength]="maxFrom"
              placeholder="a visitor"
              autocomplete="nickname"
              [ngModel]="postcard.from()"
              (ngModelChange)="postcard.from.set($event); redraw()"
            />
          </label>
        </div>

        <div class="actions">
          <button type="button" class="btn" (click)="postcard.download()" [disabled]="!postcard.previewUrl()">
            <app-icon name="download" /> Download
          </button>
          @if (postcard.canSend()) {
            <button
              type="button"
              class="btn btn-ghost"
              (click)="postcard.send()"
              [disabled]="!postcard.previewUrl() || postcard.sending()"
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
            Download keeps it on your device. Sent postcards may appear on the postcard rack once approved.
          } @else {
            Your postcard is saved to your device — nothing is sent anywhere.
          }
        </p>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(760px, calc(100vw - 32px));
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
      place-items: center;
      aspect-ratio: 16 / 10;
      border: 2px solid var(--ink);
      border-radius: 8px;
      overflow: hidden;
      background: var(--paper);
    }
    .preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .preview p {
      color: var(--muted);
    }
    .fields {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
    }
    label {
      display: grid;
      gap: 6px;
    }
    label span {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    input {
      height: 46px;
      padding: 0 14px;
      border: 2px solid var(--ink);
      border-radius: 12px;
      background: var(--paper);
      color: var(--ink);
      font: inherit;
      min-width: 0;
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
    }
  `,
})
export class PostcardDialog {
  protected readonly postcard = inject(Postcard);
  protected readonly maxMessage = MAX_MESSAGE;
  protected readonly maxFrom = MAX_FROM;
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

  /** Redraws the card shortly after typing stops. */
  protected redraw(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.postcard.render(), 250);
  }

  /** Clicking the dimmed backdrop closes the preview. */
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
