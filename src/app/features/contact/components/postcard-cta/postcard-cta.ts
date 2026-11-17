import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Postcard } from '@core/postcard';
import { Icon } from '@shared/ui/icon';

/** "Make a postcard" card on the contact page. */
@Component({
  selector: 'app-postcard-cta',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <div>
        <h3>Make a postcard</h3>
        <p>
          Turn what you painted into a two-sided postcard. Write a note on the back, pick a stamp and
          paper, then download it, share it, or send it to {{ postcard.ownerName() || 'the studio' }}.
        </p>
      </div>
      <button type="button" class="btn" (click)="postcard.open()" [disabled]="postcard.busy()">
        <app-icon name="postcard" />
        {{ postcard.busy() ? 'Printing…' : 'Make my postcard' }}
      </button>
    </div>
  `,
  styles: `
    .card {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 22px 24px;
    }
    h3 {
      font-size: 1.3rem;
      margin-bottom: 4px;
    }
    p {
      margin: 0;
      color: var(--muted);
      font-size: 0.95rem;
      max-width: 40ch;
    }
  `,
})
export class PostcardCta {
  protected readonly postcard = inject(Postcard);
}
