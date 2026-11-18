import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Connection } from '@core/connection';
import { Icon } from '@shared/ui/icon';

/**
 * "You're offline" note under the top bar. Painting keeps working without a
 * connection, so it reassures rather than blocks, keeps checking on its own
 * and offers "Try again". Says "Back online" for a moment when the connection returns.
 */
@Component({
  selector: 'app-connection-banner',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live" role="status" aria-live="polite">
      @switch (connection.state()) {
        @case ('offline') {
          <div class="note offline">
            <app-icon name="offline" />
            <p>
              <strong>You're offline.</strong>
              <span>Painting still works — the site will reconnect on its own.</span>
            </p>
            <button type="button" (click)="connection.tryNow()" [disabled]="connection.checking()">
              {{ connection.checking() ? 'Checking…' : 'Try again' }}
            </button>
          </div>
        }
        @case ('back') {
          <div class="note back">
            <app-icon name="online" />
            <p><strong>Back online.</strong></p>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      top: calc(var(--nav-h, 72px) + 10px);
      left: 50%;
      z-index: 49;
      width: min(560px, calc(100vw - 24px));
      transform: translateX(-50%);
      pointer-events: none;
    }
    .note {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 10px 16px;
      border: 2px solid var(--ink);
      border-radius: 16px;
      background: var(--paper);
      color: var(--ink);
      box-shadow: 4px 4px 0 var(--ink);
      pointer-events: auto;
      animation: drop 0.35s var(--ease, ease) both;
    }
    .back {
      width: max-content;
      margin-inline: auto;
      padding-right: 16px;
    }
    app-icon {
      flex: none;
      font-size: 1.1rem;
    }
    .offline app-icon {
      color: #d9480f;
    }
    p {
      flex: 1;
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.35;
    }
    p span {
      color: var(--muted);
    }
    button {
      flex: none;
      min-height: 40px;
      padding: 0 14px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      background: var(--ink);
      color: var(--paper);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }
    button[disabled] {
      opacity: 0.6;
      cursor: default;
    }
    button:focus-visible {
      outline: 3px solid var(--accent, var(--ink));
      outline-offset: 3px;
    }
    @keyframes drop {
      from {
        transform: translateY(-12px);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .note {
        animation: none;
      }
    }
    @media (pointer: coarse) {
      button {
        min-height: 44px;
      }
    }
    @media (max-width: 420px) {
      p span {
        display: block;
      }
    }
  `,
})
export class ConnectionBanner {
  protected readonly connection = inject(Connection);
}
