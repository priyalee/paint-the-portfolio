import { reducedMotion } from '@core/paint-state';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FLOOD_MS = 650;
const STRIP_ATTRS = ['id', 'class', 'style', 'tabindex', 'role', 'aria-label', 'aria-pressed'];
let uid = 0;

/**
 * Paint-bucket animation for any SVG shape: a blob of `fill` grows from the
 * click point, clipped to the shape, with a turbulence filter so the edge
 * looks like ink bleeding into paper. `done` runs when the shape is covered —
 * that's when the caller should commit the real fill.
 */
export function floodShape(
  el: SVGGraphicsElement,
  fill: string,
  clientPoint: { x: number; y: number } | undefined,
  done: () => void,
): void {
  const parent = el.parentNode as SVGGraphicsElement | null;
  const svg = el.ownerSVGElement;
  if (reducedMotion() || !parent || !svg || typeof parent.getScreenCTM !== 'function') {
    done();
    return;
  }

  const box = el.getBBox();
  let cx = box.x + box.width / 2;
  let cy = box.y + box.height / 2;
  const ctm = parent.getScreenCTM();
  if (clientPoint && ctm) {
    const p = new DOMPoint(clientPoint.x, clientPoint.y).matrixTransform(ctm.inverse());
    cx = p.x;
    cy = p.y;
  }
  const radius = Math.max(
    Math.hypot(cx - box.x, cy - box.y),
    Math.hypot(cx - box.x - box.width, cy - box.y),
    Math.hypot(cx - box.x, cy - box.y - box.height),
    Math.hypot(cx - box.x - box.width, cy - box.y - box.height),
  );

  // <clipPath> holding a copy of the shape, so the blob never leaks outside it.
  const defs =
    svg.querySelector(':scope > defs') ??
    svg.insertBefore(document.createElementNS(SVG_NS, 'defs'), svg.firstChild);
  const clipId = `flood-clip-${++uid}`;
  const clip = document.createElementNS(SVG_NS, 'clipPath');
  clip.id = clipId;
  clip.appendChild(stripped(el));
  defs.appendChild(clip);

  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('clip-path', `url(#${clipId})`);
  group.style.pointerEvents = 'none';
  const blob = document.createElementNS(SVG_NS, 'circle');
  blob.setAttribute('cx', String(cx));
  blob.setAttribute('cy', String(cy));
  blob.setAttribute('r', '0');
  blob.setAttribute('filter', 'url(#ink-bleed)');
  blob.style.fill = fill;
  group.appendChild(blob);

  // Re-draw the outline on top so the ink line never disappears under the blob.
  const outline = stripped(el);
  const cs = getComputedStyle(el);
  outline.style.fill = 'none';
  outline.style.stroke = cs.stroke;
  outline.style.strokeWidth = cs.strokeWidth;
  outline.style.strokeLinejoin = 'round';
  outline.style.pointerEvents = 'none';

  el.after(group, outline);

  const start = performance.now();
  const target = radius * 1.15 + 12;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FLOOD_MS);
    blob.setAttribute('r', String(target * (1 - Math.pow(1 - t, 3))));
    if (t < 1) {
      requestAnimationFrame(step);
      return;
    }
    done();
    // Let the real fill settle behind the blob before removing the overlay.
    setTimeout(() => {
      group.remove();
      outline.remove();
      clip.remove();
    }, 480);
  };
  requestAnimationFrame(step);
}

function stripped(el: Element): SVGElement {
  const copy = el.cloneNode(true) as SVGElement;
  for (const attr of STRIP_ATTRS) copy.removeAttribute(attr);
  return copy;
}
