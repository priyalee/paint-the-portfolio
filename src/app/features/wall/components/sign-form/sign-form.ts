import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAX_NAME, MAX_PLACE } from '@core/mural-store';
import { Icon } from '@shared/ui/icon';

export interface Signature {
  name: string;
  place: string;
}

/** "Sign your paint" form shared by the mural and the splash wall. */
@Component({
  selector: 'app-sign-form',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3><span class="dot" [style.background]="color()"></span>{{ heading() }}</h3>
    <p class="muted">{{ hint() }}</p>
    <div class="fields">
      <label>
        <span>Your name</span>
        <input
          type="text"
          [maxlength]="maxName"
          placeholder="Anonymous"
          autocomplete="nickname"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
        />
      </label>
      <label>
        <span>City (optional)</span>
        <input
          type="text"
          [maxlength]="maxPlace"
          placeholder="Where are you painting from?"
          [ngModel]="place()"
          (ngModelChange)="place.set($event)"
        />
      </label>
    </div>
    <div class="actions">
      <button type="button" class="btn" (click)="submit()" [disabled]="saving()">
        <app-icon name="brush" /> {{ saving() ? 'Drying…' : submitLabel() }}
      </button>
      <button type="button" class="btn btn-ghost" (click)="cancel.emit()">
        {{ cancelLabel() }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 12px;
    }
    h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.35rem;
    }
    p {
      margin: 0;
    }
    .muted {
      color: var(--muted);
      font-size: 0.92rem;
    }
    .dot {
      width: 20px;
      height: 20px;
      flex: none;
      border: 2px solid var(--ink);
      border-radius: 50%;
    }
    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
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
    @media (max-width: 860px) {
      .fields {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SignForm implements OnInit {
  readonly heading = input.required<string>();
  readonly color = input.required<string>();
  readonly hint = input('Pick another wall colour if you like, then sign it.');
  readonly submitLabel = input('Sign it');
  readonly cancelLabel = input('Cancel');
  readonly saving = input(false);
  /** Prefill when editing an existing signature. */
  readonly initial = input<Signature | null>(null);

  readonly sign = output<Signature>();
  readonly cancel = output<void>();

  protected readonly maxName = MAX_NAME;
  protected readonly maxPlace = MAX_PLACE;
  protected readonly name = signal('');
  protected readonly place = signal('');

  ngOnInit(): void {
    const sig = this.initial();
    if (!sig) return;
    this.name.set(sig.name === 'Anonymous' ? '' : sig.name);
    this.place.set(sig.place);
  }

  protected submit(): void {
    this.sign.emit({
      name: this.name().trim().slice(0, MAX_NAME) || 'Anonymous',
      place: this.place().trim().slice(0, MAX_PLACE),
    });
  }
}
