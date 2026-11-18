import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { FlipCard } from '@shared/ui/flip-card';
import { Icon } from '@shared/ui/icon';
import { PostcardAlerts } from '@core/postcard-alerts';
import { AdminSession } from '../admin-session';
import { ConfirmButton } from './confirm-button';

type Status = 'pending' | 'approved' | 'hidden';

interface QueueCard {
  id: string;
  message: string;
  from: string;
  status: Status;
  createdAt: number;
  imageUrl: string;
  /** The written side; null for cards sent before postcards had two sides. */
  backUrl: string | null;
  /** Object URLs of the privately loaded sides. */
  src?: string | null;
  backSrc?: string | null;
}

/** Review postcards (click a card to read its back): approve them onto the public rack, hide or delete them. */
@Component({
  selector: 'app-postcard-queue',
  imports: [DatePipe, FlipCard, Icon, ConfirmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters" role="tablist" aria-label="Postcard status">
      @for (s of statuses; track s) {
        <button type="button" role="tab" [class.active]="status() === s" [attr.aria-selected]="status() === s" (click)="show(s)">
          {{ labels[s] }}
        </button>
      }
    </div>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (!cards().length) {
      <p class="muted">No {{ labels[status()].toLowerCase() }} postcards.</p>
    } @else {
      <ul>
        @for (c of cards(); track c.id) {
          <li class="card">
            @if (c.src) {
              <app-flip-card [front]="c.src" [back]="c.backSrc ?? null" [alt]="'Postcard from ' + c.from" />
            } @else {
              <div class="img-missing">Image unavailable</div>
            }
            <p class="msg" style="white-space: pre-line">“{{ c.message || 'Wish you were here!' }}”</p>
            <p class="muted">— {{ c.from }} · {{ c.createdAt | date: 'medium' }}</p>
            <div class="actions">
              @if (c.status !== 'approved') {
                <button type="button" class="btn" (click)="setStatus(c, 'approved')">
                  <app-icon name="check" /> Approve
                </button>
              }
              @if (c.status !== 'hidden') {
                <button type="button" class="btn btn-ghost" (click)="setStatus(c, 'hidden')">Hide</button>
              }
              <app-confirm-button label="Delete" (confirmed)="remove(c)" />
            </div>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './admin-panel.scss',
})
export class PostcardQueue {
  private readonly session = inject(AdminSession);
  private readonly alerts = inject(PostcardAlerts);
  protected readonly statuses: Status[] = ['pending', 'approved', 'hidden'];
  protected readonly labels: Record<Status, string> = { pending: 'Waiting', approved: 'On the rack', hidden: 'Hidden' };
  protected readonly status = signal<Status>('pending');
  protected readonly cards = signal<QueueCard[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  private urls: string[] = [];
  private loadId = 0;

  constructor() {
    // The postcard bell was clicked while the office is open: show the waiting cards fresh.
    const opened = this.alerts.reviewRequests();
    effect(() => {
      if (this.alerts.reviewRequests() !== opened) untracked(() => this.show('pending'));
    });
    void this.load();
    inject(DestroyRef).onDestroy(() => {
      this.loadId++;
      this.revoke();
    });
  }

  protected show(status: Status): void {
    this.status.set(status);
    void this.load();
  }

  protected async setStatus(card: QueueCard, status: Status): Promise<void> {
    const res = await this.session.call(`/admin/postcards/${card.id}`, { method: 'POST', body: { status } });
    if (!res.ok) return this.error.set(res.reason);
    this.cards.update((list) => list.filter((c) => c.id !== card.id));
    void this.alerts.refresh();
  }

  protected async remove(card: QueueCard): Promise<void> {
    const res = await this.session.call(`/admin/postcards/${card.id}`, { method: 'DELETE' });
    if (!res.ok) return this.error.set(res.reason);
    this.cards.update((list) => list.filter((c) => c.id !== card.id));
    void this.alerts.refresh();
  }

  private async load(): Promise<void> {
    const id = ++this.loadId;
    this.loading.set(true);
    this.error.set('');
    this.revoke();
    const res = await this.session.call<QueueCard[]>(`/admin/postcards?status=${this.status()}`);
    if (id !== this.loadId) return;
    if (!res.ok) {
      this.error.set(res.reason);
      this.cards.set([]);
    } else {
      const withImages = await Promise.all(
        (Array.isArray(res.data) ? res.data : []).map(async (c) => {
          const [src, backSrc] = await Promise.all([
            this.session.image(c.imageUrl),
            c.backUrl ? this.session.image(c.backUrl) : null,
          ]);
          return { ...c, src, backSrc };
        }),
      );
      const urls = withImages.flatMap((c) => [c.src, c.backSrc]).filter((u): u is string => !!u);
      if (id !== this.loadId) {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      this.urls = urls;
      this.cards.set(withImages);
    }
    this.loading.set(false);
  }

  private revoke(): void {
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls = [];
  }
}
