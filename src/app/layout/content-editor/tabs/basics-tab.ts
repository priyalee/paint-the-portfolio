import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorSession } from '../editor-session';

/** Editor tab: Name, role, tagline, location, email, resume. */
@Component({
  selector: 'app-basics-tab',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    <label class="field">
      <span>Full name</span>
      <input [(ngModel)]="w.name" (ngModelChange)="session.changed()" maxlength="60" />
    </label>
    <div class="row">
      <label class="field narrow">
        <span>Initials</span>
        <input [(ngModel)]="w.initials" (ngModelChange)="session.changed()" maxlength="3" />
      </label>
      <label class="field">
        <span>Role / title</span>
        <input [(ngModel)]="w.role" (ngModelChange)="session.changed()" maxlength="120" />
      </label>
    </div>
    <label class="field">
      <span>Tagline (one sentence)</span>
      <textarea rows="2" [(ngModel)]="w.tagline" (ngModelChange)="session.changed()" maxlength="240"></textarea>
    </label>
    <div class="row">
      <label class="field">
        <span>Location</span>
        <input [(ngModel)]="w.location" (ngModelChange)="session.changed()" maxlength="80" />
      </label>
      <label class="field">
        <span>Email</span>
        <input type="email" [(ngModel)]="w.email" (ngModelChange)="session.changed()" maxlength="120" />
      </label>
    </div>
    <label class="field">
      <span>Resume link (PDF URL, optional)</span>
      <input type="url" [(ngModel)]="w.resumeUrl" (ngModelChange)="session.changed()" placeholder="https://…" />
    </label>
  `,
})
export class BasicsTab {
  protected readonly session = inject(EditorSession);
}
