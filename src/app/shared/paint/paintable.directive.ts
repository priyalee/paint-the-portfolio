import { Directive, ElementRef, OnInit, computed, inject, input } from '@angular/core';
import { PaintScope, PaintState } from '@core/paint-state';
import { floodShape } from './flood';


/**
 * Makes any SVG shape a paint-bucket target.
 *
 *   <path appPaintable="sun" [trueColor]="1" d="…" />
 *
 * Clicking floods the shape with the active pigment: a blob grows from the
 * exact click point, clipped to the shape, with a turbulence filter so the
 * edge looks like ink bleeding into paper. Enter/Space does the same from
 * the shape's centre for keyboard users.
 */
@Directive({
  selector: '[appPaintable]',
  host: {
    class: 'paintable',
    tabindex: '0',
    role: 'button',
    '[class.is-painted]': 'painted() !== undefined',
    '[style.fill]': 'fill()',
    '[attr.aria-label]': 'ariaLabel()',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class Paintable implements OnInit {
  readonly id = input.required<string>({ alias: 'appPaintable' });
  /** Palette slot shown in colour mode when the visitor hasn't painted it. null = stays paper. */
  readonly trueColor = input<number | null>(null);
  readonly scope = input<PaintScope>('site');
  readonly label = input('shape');

  private readonly state = inject(PaintState);
  private readonly el = inject<ElementRef<SVGGraphicsElement>>(ElementRef);

  protected readonly painted = computed(() => this.state.fillOf(this.scope(), this.id()));

  protected readonly fill = computed(() => {
    const painted = this.painted();
    if (painted !== undefined) return `var(--p${painted})`;
    const t = this.trueColor();
    if (this.state.mode() === 'color' && t !== null) return `var(--p${t})`;
    return 'var(--paper)';
  });

  protected readonly ariaLabel = computed(() => {
    const painted = this.painted();
    const colour =
      painted === undefined ? 'unpainted' : `painted ${this.state.palette().colors[painted].name}`;
    return `${this.label()}, ${colour}. Press Enter to fill with ${this.state.activeColor().name}.`;
  });

  ngOnInit(): void {
    this.state.register(this.scope(), this.id());
  }

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.paint({ x: event.clientX, y: event.clientY });
  }

  protected onKey(event: Event): void {
    event.preventDefault();
    this.paint();
  }

  private paint(clientPoint?: { x: number; y: number }): void {
    if (this.state.tool() === 'eraser') {
      this.state.apply(this.scope(), this.id(), null);
      return;
    }
    const slot = this.state.slot();
    if (this.painted() === slot) return;
    this.flood(slot, clientPoint);
  }

  private flood(slot: number, clientPoint?: { x: number; y: number }): void {
    floodShape(this.el.nativeElement, `var(--p${slot})`, clientPoint, () =>
      this.state.apply(this.scope(), this.id(), slot),
    );
  }
}
