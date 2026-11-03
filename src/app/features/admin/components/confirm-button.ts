import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/** A delete button that asks "Sure?" on the first click instead of a browser popup. */
@Component({
  selector: 'app-confirm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (asking()) {
      <button type="button" class="btn danger" (click)="confirm()">Yes, {{ label().toLowerCase() }}</button>
      <button type="button" class="btn btn-ghost" (click)="asking.set(false)">Keep</button>
    } @else {
      <button type="button" class="btn btn-ghost" (click)="asking.set(true)">{{ label() }}</button>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      gap: 8px;
    }
    .danger {
      background: #c0392b;
      border-color: #c0392b;
      color: #fff;
    }
  `,
})
export class ConfirmButton {
  readonly label = input('Delete');
  readonly confirmed = output<void>();
  protected readonly asking = signal(false);

  protected confirm(): void {
    this.asking.set(false);
    this.confirmed.emit();
  }
}
