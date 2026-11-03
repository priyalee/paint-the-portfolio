import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBehance,
  faCodepen,
  faDribbble,
  faGithub,
  faInstagram,
  faLinkedin,
  faMedium,
  faStackOverflow,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { faFile } from '@fortawesome/free-regular-svg-icons';
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faAward,
  faBars,
  faCheck,
  faCity,
  faChevronDown,
  faCopy,
  faDice,
  faDownload,
  faEnvelope,
  faEraser,
  faFileImport,
  faFillDrip,
  faImage,
  faLink,
  faMoon,
  faPaintRoller,
  faPaintbrush,
  faPalette,
  faPenToSquare,
  faRepeat,
  faRotateLeft,
  faRotateRight,
  faShareNodes,
  faSplotch,
  faSun,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

/**
 * Every icon used on the site: friendly name mapped to a Font Awesome icon.
 * Add new ones here so templates stay simple: <app-icon name="bucket" />
 */
const ICONS = {
  // tools
  bucket: faFillDrip,
  roller: faPaintRoller,
  brush: faPaintbrush,
  eraser: faEraser,
  paper: faFile,
  palette: faPalette,
  dice: faDice,
  undo: faRotateLeft,
  redo: faRotateRight,
  reset: faArrowsRotate,
  postcard: faImage,
  download: faDownload,
  import: faFileImport,
  copy: faCopy,
  share: faShareNodes,
  // ui
  sun: faSun,
  moon: faMoon,
  menu: faBars,
  close: faXmark,
  arrow: faArrowRight,
  'arrow-left': faArrowLeft,
  up: faArrowUp,
  down: faArrowDown,
  chevron: faChevronDown,
  flip: faRepeat,
  check: faCheck,
  award: faAward,
  edit: faPenToSquare,
  mail: faEnvelope,
  external: faArrowUpRightFromSquare,
  link: faLink,
  city: faCity,
  splotch: faSplotch,
  // brands (social links)
  github: faGithub,
  linkedin: faLinkedin,
  x: faXTwitter,
  instagram: faInstagram,
  dribbble: faDribbble,
  behance: faBehance,
  medium: faMedium,
  youtube: faYoutube,
  codepen: faCodepen,
  stackoverflow: faStackOverflow,
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

/** Picks the brand icon for a social URL (falls back to a link icon). */
export function brandIconFor(url: string): IconName {
  const host = url.toLowerCase();
  const brands: [string, IconName][] = [
    ['github.com', 'github'],
    ['linkedin.com', 'linkedin'],
    ['x.com', 'x'],
    ['twitter.com', 'x'],
    ['instagram.com', 'instagram'],
    ['dribbble.com', 'dribbble'],
    ['behance.net', 'behance'],
    ['medium.com', 'medium'],
    ['youtube.com', 'youtube'],
    ['codepen.io', 'codepen'],
    ['stackoverflow.com', 'stackoverflow'],
  ];
  return brands.find(([domain]) => host.includes(domain))?.[1] ?? 'link';
}

/** Font Awesome icon by friendly name. Decorative (aria-hidden) — label the button instead. */
@Component({
  selector: 'app-icon',
  imports: [FaIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<fa-icon [icon]="icon()" />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.15em;
      height: 1.15em;
      flex: none;
      line-height: 1;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  protected readonly icon = computed(() => ICONS[this.name()]);
}
