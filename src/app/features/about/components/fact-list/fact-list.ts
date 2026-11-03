import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Grid of quick facts ("Based in", "Focus", …). */
@Component({
  selector: 'app-fact-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl>
      @for (f of facts(); track $index) {
        <div>
          <dt>{{ f.label }}</dt>
          <dd>{{ f.value }}</dd>
        </div>
      }
    </dl>
  `,
  styles: `
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 28px 0;
    }
    div {
      padding: 14px 16px;
      border: 1.5px solid var(--ink);
      border-radius: var(--radius);
    }
    dt {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
    }
    dd {
      margin: 4px 0 0;
      font-weight: 600;
    }
  `,
})
export class FactList {
  readonly facts = input.required<{ label: string; value: string }[]>();
}
