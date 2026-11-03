/** Helpers for turning live SVG / canvas art into images (postcard + studio export). */

const INLINE_PROPS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
];

/**
 * Serialises an on-screen <svg> to an <img>. Computed styles are inlined so
 * CSS variables (palette, theme) survive outside the page.
 */
export async function svgToImage(svg: SVGSVGElement, scale = 2): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const src = [svg, ...Array.from(svg.querySelectorAll('*'))];
  const dst = [clone, ...Array.from(clone.querySelectorAll('*'))];
  src.forEach((node, i) => {
    const target = dst[i] as SVGElement | undefined;
    if (!target?.style) return;
    const cs = getComputedStyle(node);
    for (const prop of INLINE_PROPS) target.style.setProperty(prop, cs.getPropertyValue(prop));
  });

  const vb = svg.viewBox.baseVal;
  const width = vb && vb.width ? vb.width : svg.clientWidth;
  const height = vb && vb.height ? vb.height : svg.clientHeight;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width * scale));
  clone.setAttribute('height', String(height * scale));
  clone.style.removeProperty('opacity');

  const markup = new XMLSerializer().serializeToString(clone);
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup));
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();
  return img;
}

export function sizeOf(src: CanvasImageSource): { w: number; h: number } {
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight };
  if (src instanceof HTMLCanvasElement) return { w: src.width, h: src.height };
  return { w: 1, h: 1 };
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'),
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Lays several images out in a tidy grid on one canvas (used to turn a page
 * full of small painted pieces — jars, chips, dots — into one postcard panel).
 */
export function collage(images: CanvasImageSource[], paper: string): CanvasImageSource {
  if (images.length === 1) return images[0];
  const cols = Math.ceil(Math.sqrt(images.length * 1.6));
  const rows = Math.ceil(images.length / cols);
  const tile = 320;
  const gap = 28;
  const canvas = document.createElement('canvas');
  canvas.width = cols * tile + (cols + 1) * gap;
  canvas.height = rows * tile + (rows + 1) * gap;
  const ctx = canvas.getContext('2d');
  if (!ctx) return images[0];
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  images.forEach((img, i) => {
    const { w, h } = sizeOf(img);
    const scale = Math.min(tile / w, tile / h);
    const x = gap + (i % cols) * (tile + gap) + (tile - w * scale) / 2;
    const y = gap + Math.floor(i / cols) * (tile + gap) + (tile - h * scale) / 2;
    ctx.drawImage(img, x, y, w * scale, h * scale);
  });
  return canvas;
}
