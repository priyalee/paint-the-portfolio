import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '@shared/ui/icon';
import { PaintState } from '@core/paint-state';
import { EditorSession } from '../editor-session';

/** Editor tab: Projects, tech, chip colour and links. */
@Component({
  selector: 'app-projects-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    @let w = session.work();
    @for (p of w.projects; track $index; let i = $index) {
      <fieldset class="group">
        <div class="row">
          <strong class="num">#{{ i + 1 }}</strong>
          <span class="spacer"></span>
          <button type="button" (click)="session.move(w.projects, i, -1)" aria-label="Move up"><app-icon name="up" /></button>
          <button type="button" (click)="session.move(w.projects, i, 1)" aria-label="Move down"><app-icon name="down" /></button>
          <button type="button" class="danger small" (click)="session.remove(w.projects, i)" aria-label="Remove project"><app-icon name="close" /></button>
        </div>
        <div class="row">
          <label class="field">
            <span>Title</span>
            <input [(ngModel)]="p.title" (ngModelChange)="session.changed()" />
          </label>
          <label class="field narrow">
            <span>Year</span>
            <input [(ngModel)]="p.year" (ngModelChange)="session.changed()" />
          </label>
        </div>
        <label class="field">
          <span>One-line pitch</span>
          <input [(ngModel)]="p.tagline" (ngModelChange)="session.changed()" />
        </label>
        <label class="field">
          <span>Description</span>
          <textarea rows="3" [(ngModel)]="p.description" (ngModelChange)="session.changed()"></textarea>
        </label>
        <label class="field">
          <span>Tech (comma separated)</span>
          <input [value]="p.tech.join(', ')" (change)="session.setTech(p, $any($event.target).value)" />
        </label>
        <div class="field">
          <span>Chip colour</span>
          <div class="slots">
            @for (c of paint.palette().colors; track $index; let ci = $index) {
              <button
                type="button"
                class="slot"
                [style.background]="c.hex"
                [class.active]="p.slot === ci"
                (click)="p.slot = ci; session.changed()"
                [attr.aria-label]="c.name"
                [title]="c.name"
              ></button>
            }
          </div>
        </div>
        <div class="field">
          <span>Links</span>
          @for (l of p.links; track $index; let li = $index) {
            <div class="row">
              <input class="narrow-input" [(ngModel)]="l.label" (ngModelChange)="session.changed()" placeholder="Label" />
              <input type="url" [(ngModel)]="l.url" (ngModelChange)="session.changed()" placeholder="https://…" />
              <button type="button" class="danger small" (click)="session.remove(p.links, li)" aria-label="Remove link"><app-icon name="close" /></button>
            </div>
          }
          <button type="button" class="add" (click)="session.add(p.links, { label: 'Live', url: '' })">+ Add link</button>
        </div>
      </fieldset>
    }
    <button
      type="button"
      class="add"
      (click)="session.add(w.projects, { title: 'New project', year: '', tagline: '', description: '', tech: [], links: [], slot: w.projects.length % 6 })"
    >
      + Add project
    </button>
  `,
})
export class ProjectsTab {
  protected readonly session = inject(EditorSession);
  protected readonly paint = inject(PaintState);
}
