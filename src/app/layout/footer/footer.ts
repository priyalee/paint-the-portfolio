import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaintState } from '@core/paint-state';
import { ContentStore } from '@core/content-store';
import { Icon } from '@shared/ui/icon';

@Component({
  selector: 'app-footer',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container inner">
      <p>
        Sketched in ink, finished in colour by <strong>{{ data().name }}</strong> ·
        {{ year }}
      </p>
      <div class="strip" aria-hidden="true">
        @for (c of state.palette().colors; track $index) {
          <span [style.background]="c.hex"></span>
        }
      </div>
      <p class="hand">
        Built with Angular &amp; a lot of digital paint.
        <!-- Hidden door to the content editor (also: Ctrl+Alt+E or ?edit) -->
        <button
          type="button"
          class="secret"
          (click)="store.editorOpen.set(true)"
          aria-label="Edit site content"
          title="Edit content"
        >
          <app-icon name="edit" />
        </button>
      </p>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      z-index: 1;
      border-top: 2px solid var(--ink);
      padding: 40px 0 120px;
    }
    /* Phones: the paint dock is two rows tall there, so leave more room. */
    @media (max-width: 720px) {
      :host {
        padding-bottom: 160px;
      }
    }
    .inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    p {
      margin: 0;
    }
    .strip {
      display: flex;
      border: 2px solid var(--ink);
      border-radius: 999px;
      overflow: hidden;
    }
    .secret {
      margin-left: 6px;
      padding: 0 4px;
      border: 0;
      background: none;
      font-size: 0.9rem;
      opacity: 0.12;
      cursor: pointer;
      transition: opacity 0.3s;
    }
    .secret:hover,
    .secret:focus-visible {
      opacity: 1;
    }
    .strip span {
      width: 28px;
      height: 14px;
      transition: background-color 0.5s;
    }
  `,
})
export class Footer {
  protected readonly state = inject(PaintState);
  protected readonly store = inject(ContentStore);
  protected readonly data = this.store.content;
  protected readonly year = new Date().getFullYear();
}
