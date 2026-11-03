import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '@shared/ui/icon';
import { EditorSession } from '../editor-session';

/** Editor tab: Experience / education timeline. */
@Component({
  selector: 'app-journey-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    <p class="tip">Newest first. Education works here too.</p>
    @for (e of w.experience; track $index; let i = $index) {
      <fieldset class="group">
        <div class="row">
          <strong class="num">#{{ i + 1 }}</strong>
          <span class="spacer"></span>
          <button type="button" (click)="session.move(w.experience, i, -1)" aria-label="Move up"><app-icon name="up" /></button>
          <button type="button" (click)="session.move(w.experience, i, 1)" aria-label="Move down"><app-icon name="down" /></button>
          <button type="button" class="danger small" (click)="session.remove(w.experience, i)" aria-label="Remove entry"><app-icon name="close" /></button>
        </div>
        <div class="row">
          <label class="field">
            <span>Role / degree</span>
            <input [(ngModel)]="e.role" (ngModelChange)="session.changed()" />
          </label>
          <label class="field">
            <span>Company / school</span>
            <input [(ngModel)]="e.org" (ngModelChange)="session.changed()" />
          </label>
        </div>
        <label class="field">
          <span>Period</span>
          <input [(ngModel)]="e.period" (ngModelChange)="session.changed()" placeholder="2023 — Present" />
        </label>
        <label class="field">
          <span>Summary</span>
          <textarea rows="2" [(ngModel)]="e.summary" (ngModelChange)="session.changed()"></textarea>
        </label>
        <label class="field">
          <span>Highlights (one per line)</span>
          <textarea rows="3" [value]="e.highlights.join('\\n')" (change)="session.setHighlights(e, $any($event.target).value)"></textarea>
        </label>
      </fieldset>
    }
    <button
      type="button"
      class="add"
      (click)="session.add(w.experience, { role: '', org: '', period: '', summary: '', highlights: [] })"
    >
      + Add entry
    </button>
  `,
})
export class JourneyTab {
  protected readonly session = inject(EditorSession);
}
