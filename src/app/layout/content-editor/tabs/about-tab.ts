import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '@shared/ui/icon';
import { EditorSession } from '../editor-session';

/** Editor tab: About paragraphs and quick facts. */
@Component({
  selector: 'app-about-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    <h3>Paragraphs</h3>
    @for (p of w.about; track $index; let i = $index) {
      <div class="item">
        <textarea rows="4" [(ngModel)]="w.about[i]" (ngModelChange)="session.changed()"></textarea>
        <div class="item-tools">
          <button type="button" (click)="session.move(w.about, i, -1)" aria-label="Move up"><app-icon name="up" /></button>
          <button type="button" (click)="session.move(w.about, i, 1)" aria-label="Move down"><app-icon name="down" /></button>
          <button type="button" class="danger" (click)="session.remove(w.about, i)">Remove</button>
        </div>
      </div>
    }
    <button type="button" class="add" (click)="session.add(w.about, '')">+ Add paragraph</button>

    <h3>Quick facts</h3>
    @for (f of w.facts; track $index; let i = $index) {
      <div class="item row">
        <input [(ngModel)]="f.label" (ngModelChange)="session.changed()" placeholder="Label" maxlength="40" />
        <input [(ngModel)]="f.value" (ngModelChange)="session.changed()" placeholder="Value" maxlength="80" />
        <button type="button" class="danger small" (click)="session.remove(w.facts, i)" aria-label="Remove fact"><app-icon name="close" /></button>
      </div>
    }
    <button type="button" class="add" (click)="session.add(w.facts, { label: '', value: '' })">+ Add fact</button>
  `,
})
export class AboutTab {
  protected readonly session = inject(EditorSession);
}
