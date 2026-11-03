import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { api } from '@core/api';
import { MURAL } from '@shared/art/mural';
import { AdminSession } from '../admin-session';
import { ConfirmButton } from './confirm-button';

interface Mark {
  id: string;
  kind: 'mural' | 'splashes';
  label: string;
  color: string;
  name: string;
  place: string;
  createdAt: number;
}

/** Every mural shape and splash, newest first, with a delete button for clean-up. */
@Component({
  selector: 'app-wall-marks',
  imports: [DatePipe, ConfirmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    @if (!marks().length) {
      <p class="muted">Nobody has painted the walls yet.</p>
    } @else {
      <ul class="rows">
        @for (m of marks(); track m.id) {
          <li>
            <span class="dot" [style.background]="m.color"></span>
            <span class="who">
              <strong>{{ m.name }}</strong>
              <span class="muted">
                {{ m.label }}{{ m.place ? ' · ' + m.place : '' }} · {{ m.createdAt | date: 'medium' }}
              </span>
            </span>
            <app-confirm-button label="Remove" (confirmed)="remove(m)" />
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './admin-panel.scss',
})
export class WallMarks {
  private readonly session = inject(AdminSession);
  protected readonly marks = signal<Mark[]>([]);
  protected readonly error = signal('');

  constructor() {
    void this.load();
  }

  protected async remove(mark: Mark): Promise<void> {
    const res = await this.session.call(`/admin/${mark.kind}/${mark.id}`, { method: 'DELETE' });
    if (!res.ok) return this.error.set(res.reason);
    this.marks.update((list) => list.filter((m) => m.id !== mark.id));
  }

  private async load(): Promise<void> {
    type Row = Omit<Mark, 'kind' | 'label'> & { regionId?: string };
    const [mural, splashes] = await Promise.all([api<Row[]>('/mural'), api<Row[]>('/splashes')]);
    if (!mural.ok || !splashes.ok) {
      this.error.set('Could not load the walls.');
      return;
    }
    const shapeLabel = new Map(MURAL.shapes.map((s) => [s.id, s.label]));
    this.marks.set(
      [
        ...mural.data.map((r) => ({ ...r, kind: 'mural' as const, label: `Mural: ${shapeLabel.get(r.regionId ?? '') ?? 'shape'}` })),
        ...splashes.data.map((r) => ({ ...r, kind: 'splashes' as const, label: 'Splash' })),
      ].sort((a, b) => b.createdAt - a.createdAt),
    );
  }
}
