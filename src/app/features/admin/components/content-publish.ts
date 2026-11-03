import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Icon } from '@shared/ui/icon';
import { AdminSession } from '../admin-session';

/** Publishes the content edited in the site editor, so every visitor sees it. */
@Component({
  selector: 'app-content-publish',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>
      Edit your text, projects and links in the site editor (press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> +
      <kbd>E</kbd> on any page). Your changes are saved as a draft in this browser — publish them here
      when you're happy.
    </p>
    <p class="muted">
      @if (store.hasDraft()) {
        You have unpublished changes for <strong>{{ store.content().name }}</strong>.
      } @else {
        No unpublished changes. Publishing again re-sends the current content.
      }
    </p>
    <div class="actions">
      <button type="button" class="btn" (click)="publish()" [disabled]="busy()">
        <app-icon name="check" /> {{ busy() ? 'Publishing…' : 'Publish to the live site' }}
      </button>
      <button type="button" class="btn btn-ghost" (click)="store.editorOpen.set(true)">
        <app-icon name="edit" /> Open the editor
      </button>
    </div>
    @if (message(); as m) {
      <p [class]="m.ok ? 'ok' : 'error'" role="status">{{ m.text }}</p>
    }
  `,
  styleUrl: './admin-panel.scss',
})
export class ContentPublish {
  protected readonly store = inject(ContentStore);
  private readonly session = inject(AdminSession);
  protected readonly busy = signal(false);
  protected readonly message = signal<{ ok: boolean; text: string } | null>(null);

  protected async publish(): Promise<void> {
    this.busy.set(true);
    const res = await this.store.publish(this.session.key());
    this.message.set(res.ok ? { ok: true, text: 'Published — every visitor now sees this content.' } : { ok: false, text: res.error });
    this.busy.set(false);
  }
}
