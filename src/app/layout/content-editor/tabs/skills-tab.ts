import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '@shared/ui/icon';
import { EditorSession } from '../editor-session';

/** Editor tab: Skill groups and levels. */
@Component({
  selector: 'app-skills-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    @for (g of w.skills; track $index; let gi = $index) {
      <fieldset class="group">
        <div class="row">
          <input class="group-name" [(ngModel)]="g.name" (ngModelChange)="session.changed()" placeholder="Group name" />
          <button type="button" (click)="session.move(w.skills, gi, -1)" aria-label="Move group up"><app-icon name="up" /></button>
          <button type="button" (click)="session.move(w.skills, gi, 1)" aria-label="Move group down"><app-icon name="down" /></button>
          <button type="button" class="danger small" (click)="session.remove(w.skills, gi)" aria-label="Remove group"><app-icon name="close" /></button>
        </div>
        @for (s of g.items; track $index; let si = $index) {
          <div class="skill">
            <input [(ngModel)]="s.name" (ngModelChange)="session.changed()" placeholder="Skill" />
            <input type="range" min="0" max="100" step="5" [(ngModel)]="s.level" (ngModelChange)="session.changed()" [attr.aria-label]="s.name + ' level'" />
            <span class="lvl">{{ s.level }}%</span>
            <button type="button" class="danger small" (click)="session.remove(g.items, si)" aria-label="Remove skill"><app-icon name="close" /></button>
          </div>
        }
        <button type="button" class="add" (click)="session.add(g.items, { name: '', level: 60 })">+ Add skill</button>
      </fieldset>
    }
    <button type="button" class="add" (click)="session.add(w.skills, { name: 'New group', items: [] })">+ Add skill group</button>
  `,
})
export class SkillsTab {
  protected readonly session = inject(EditorSession);
}
