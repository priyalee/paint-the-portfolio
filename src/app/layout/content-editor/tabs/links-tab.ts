import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '@shared/ui/icon';
import { EditorSession } from '../editor-session';

/** Editor tab: Social / profile links. */
@Component({
  selector: 'app-links-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    <p class="tip">Shown in the Contact section. Use full https:// links.</p>
    @for (s of w.socials; track $index; let i = $index) {
      <fieldset class="group">
        <div class="row">
          <input class="narrow-input" [(ngModel)]="s.label" (ngModelChange)="session.changed()" placeholder="GitHub" />
          <input [(ngModel)]="s.handle" (ngModelChange)="session.changed()" placeholder="@username" />
          <button type="button" class="danger small" (click)="session.remove(w.socials, i)" aria-label="Remove link"><app-icon name="close" /></button>
        </div>
        <input type="url" [(ngModel)]="s.url" (ngModelChange)="session.changed()" placeholder="https://github.com/username" />
      </fieldset>
    }
    <button type="button" class="add" (click)="session.add(w.socials, { label: '', handle: '', url: '' })">+ Add link</button>
  `,
})
export class LinksTab {
  protected readonly session = inject(EditorSession);
}
