import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SocialLink } from '@data/portfolio.data';
import { Icon, brandIconFor } from '@shared/ui/icon';

/** List of social / profile links. */
@Component({
  selector: 'app-social-links',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (s of links(); track $index) {
        <li>
          <a [href]="s.url" target="_blank" rel="noopener">
            <app-icon class="brand" [name]="brandIcon(s.url)" />
            <span class="label">{{ s.label }}</span>
            <span class="handle">{{ s.handle }}</span>
            <app-icon name="external" />
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    ul {
      display: grid;
      gap: 10px;
      margin: 0 0 32px;
      padding: 0;
      list-style: none;
    }
    a {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 4px;
      border-bottom: 1.5px dashed var(--line);
      text-decoration: none;
      transition: padding 0.25s var(--ease);
    }
    a:hover {
      padding-left: 12px;
    }
    .brand {
      font-size: 1.3rem;
    }
    .label {
      font-weight: 700;
      min-width: 90px;
    }
    .handle {
      color: var(--muted);
      flex: 1;
    }
  `,
})
export class SocialLinks {
  readonly links = input.required<SocialLink[]>();
  protected readonly brandIcon = brandIconFor;
}
