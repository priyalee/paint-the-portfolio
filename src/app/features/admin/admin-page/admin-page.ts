import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ApiStatus } from '@core/api';
import { PostcardAlerts } from '@core/postcard-alerts';
import { Icon } from '@shared/ui/icon';
import { AdminSession } from '../admin-session';
import { ContentPublish } from '../components/content-publish';
import { PostcardQueue } from '../components/postcard-queue';
import { WallMarks } from '../components/wall-marks';

type Tab = 'postcards' | 'walls' | 'content';

/**
 * The owner's back office at /admin (not linked anywhere, not indexed):
 * review postcards, clean up the walls and publish site content.
 */
@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, Icon, PostcardQueue, WallMarks, ContentPublish],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section">
      <div class="container narrow">
        <header class="section-head">
          <span class="eyebrow">Studio office</span>
          <h2>Behind the <em>easel</em></h2>
        </header>

        @if (!apiUp) {
          <div class="card panel">
            <h3>The backend isn't running here</h3>
            <p class="muted">
              The admin works on the live site, or locally with <code>npm run api</code> (see README).
            </p>
          </div>
        } @else if (!session.signedIn()) {
          <form class="card panel login" (ngSubmit)="login()">
            <label>
              <span>Admin key</span>
              <input
                type="password"
                name="key"
                autocomplete="current-password"
                [ngModel]="keyInput()"
                (ngModelChange)="keyInput.set($event)"
                required
              />
            </label>
            <button type="submit" class="btn" [disabled]="busy() || !keyInput()">
              {{ busy() ? 'Checking…' : 'Open the office' }}
            </button>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
          </form>
        } @else {
          <nav class="tabs" aria-label="Admin sections">
            <button type="button" [class.active]="tab() === 'postcards'" (click)="tab.set('postcards')">
              <app-icon name="mail" /> Postcards
            </button>
            <button type="button" [class.active]="tab() === 'walls'" (click)="tab.set('walls')">
              <app-icon name="brush" /> Walls
            </button>
            <button type="button" [class.active]="tab() === 'content'" (click)="tab.set('content')">
              <app-icon name="edit" /> Content
            </button>
            <button
              type="button"
              class="bell"
              [attr.aria-pressed]="alerts.enabled()"
              (click)="toggleBell()"
              title="The postcard bell shows on this device when postcards are waiting"
            >
              <app-icon name="bell" /> Bell on this device: {{ alerts.enabled() ? 'on' : 'off' }}
            </button>
            <button type="button" class="out" (click)="session.logout()">Sign out</button>
          </nav>

          <div class="card panel">
            @switch (tab()) {
              @case ('postcards') {
                <app-postcard-queue />
              }
              @case ('walls') {
                <app-wall-marks />
              }
              @case ('content') {
                <app-content-publish />
              }
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .narrow {
      max-width: 980px;
    }
    .panel {
      display: grid;
      gap: 14px;
      padding: clamp(16px, 3vw, 28px);
    }
    .panel h3 {
      margin: 0;
    }
    .muted {
      margin: 0;
      color: var(--muted);
    }
    .login {
      max-width: 420px;
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
    }
    .error {
      margin: 0;
      padding: 10px 14px;
      border-radius: 10px;
      background: #c0392b;
      color: #fff;
    }
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 18px;
      border: 2px solid var(--ink);
      border-radius: 999px;
      background: var(--paper);
      color: var(--ink);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    .tabs button.active {
      background: var(--ink);
      color: var(--paper);
    }
    .tabs .bell {
      margin-left: auto;
      border-style: dashed;
    }
    .tabs .bell[aria-pressed='true'] {
      border-style: solid;
    }
    .tabs .out {
      border-style: dashed;
    }
  `,
})
export class AdminPage {
  protected readonly session = inject(AdminSession);
  protected readonly alerts = inject(PostcardAlerts);
  protected readonly apiUp = inject(ApiStatus).available();
  protected readonly tab = signal<Tab>('postcards');
  protected readonly keyInput = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    inject(DestroyRef).onDestroy(() => meta.removeTag('name="robots"'));
    if (this.apiUp) void this.session.resume();
    // Clicking the postcard bell (even from inside the office) opens the Postcards tab.
    const opened = this.alerts.reviewRequests();
    effect(() => {
      if (this.alerts.reviewRequests() !== opened) this.tab.set('postcards');
    });
  }

  /** Switches the postcard bell on or off for this device. */
  protected async toggleBell(): Promise<void> {
    if (this.alerts.enabled()) this.alerts.switchOff();
    else await this.alerts.switchOn(this.session);
  }

  protected async login(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    const res = await this.session.login(this.keyInput().trim());
    if (!res.ok) this.error.set(res.reason);
    else this.keyInput.set('');
    this.busy.set(false);
  }
}
