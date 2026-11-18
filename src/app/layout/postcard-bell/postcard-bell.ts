import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostcardAlerts } from '@core/postcard-alerts';
import { Icon } from '@shared/ui/icon';

/**
 * The owner's notification corner: a bell under the top bar that appears
 * when new postcards arrive and stays (even across reloads) until clicked.
 * Clicking it opens the office (/admin) on the postcards waiting for approval.
 * Only rendered on devices set up in /admin — visitors never see it.
 */
@Component({
  selector: 'app-postcard-bell',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (alerts.enabled() && alerts.hasNew()) {
      <a class="bell" routerLink="/admin" [attr.aria-label]="label()" [title]="label()" (click)="alerts.markSeen()">
        <app-icon name="bell" />
        <span class="count" aria-hidden="true">{{ alerts.fresh() > 99 ? '99+' : alerts.fresh() }}</span>
      </a>
    }
  `,
  styles: `
    :host {
      position: fixed;
      top: calc(var(--nav-h, 72px) + 12px);
      right: 16px;
      /* Just under the top bar, so the phone menu (which drops down from it) covers the bell. */
      z-index: 49;
    }
    .bell {
      position: relative;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border: 2px solid var(--ink);
      border-radius: 50%;
      background: var(--paper);
      color: var(--ink);
      box-shadow: 3px 3px 0 var(--ink);
      font-size: 1.15rem;
      text-decoration: none;
      animation: pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both;
    }
    .bell:hover {
      transform: translateY(-2px);
    }
    .bell:focus-visible {
      outline: 3px solid var(--accent, var(--ink));
      outline-offset: 3px;
    }
    /* A ring keeps pulsing until the bell is clicked. */
    .bell::after {
      content: '';
      position: absolute;
      inset: -6px;
      border: 2px solid #d9480f;
      border-radius: 50%;
      animation: ring 1.6s ease-out infinite;
    }
    @keyframes ring {
      from {
        transform: scale(0.85);
        opacity: 1;
      }
      to {
        transform: scale(1.35);
        opacity: 0;
      }
    }
    @keyframes pop {
      from {
        transform: scale(0.3);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .bell,
      .bell::after {
        animation: none;
      }
    }
    .count {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border: 2px solid var(--ink);
      border-radius: 99px;
      background: #d9480f;
      color: #fff;
      font: 700 0.72rem/18px system-ui, sans-serif;
      text-align: center;
    }
    @media (max-width: 600px) {
      :host {
        right: 12px;
        top: calc(var(--nav-h, 72px) + 8px);
      }
    }
  `,
})
export class PostcardBell {
  protected readonly alerts = inject(PostcardAlerts);

  protected readonly label = computed(() => {
    const n = this.alerts.fresh();
    return `${n} new postcard${n === 1 ? '' : 's'} — open the office to approve`;
  });
}
