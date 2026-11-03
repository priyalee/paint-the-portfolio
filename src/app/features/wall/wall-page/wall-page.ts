import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Icon } from '@shared/ui/icon';
import { SectionHeader } from '@shared/ui/section-header';
import { MuralBoard } from '../components/mural-board/mural-board';
import { SplashBoard } from '../components/splash-board/splash-board';

type WallView = 'mural' | 'splash';

/**
 * The community wall: two ways for visitors to leave their mark.
 * The mural (paint one shape of a city) and the splash wall (throw one
 * splash of paint). The choice lives in the URL: /wall?view=splash
 */
@Component({
  selector: 'app-wall-page',
  imports: [RouterLink, SectionHeader, Icon, MuralBoard, SplashBoard],
  templateUrl: './wall-page.html',
  styleUrl: './wall-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WallPage {
  protected readonly view = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((q): WallView => (q.get('view') === 'splash' ? 'splash' : 'mural')),
    ),
    { initialValue: 'mural' as WallView },
  );

  protected readonly note = computed(() =>
    this.view() === 'splash'
      ? 'Throw one splash of paint anywhere on the wall, then sign it.'
      : 'Every visitor fills one shape. Together we finish the city.',
  );
}
