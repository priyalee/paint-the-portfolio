import { Injectable, inject, signal } from '@angular/core';
import { ApiStatus, api } from '@core/api';
import { ContentStore } from '@core/content-store';
import { PaintState } from '@core/paint-state';
import { canvasToBlob, downloadBlob } from '@core/snapshot';
import { PORTFOLIO } from '@data/portfolio.data';
import { THEMES } from '@core/palettes';
import { MAX_FROM } from '@core/wall-limits';
import {
  drawArtwork,
  drawFallbackArt,
  drawPostmark,
  drawStamp,
  fitText,
  layout,
  wrapText,
} from '@core/postcard-art';

export interface PostcardSource {
  id: string;
  /** Lower comes first; the first source gets the big left panel. */
  order: number;
  snapshot: () => Promise<CanvasImageSource | null>;
}

export { MAX_FROM, MAX_MESSAGE } from '@core/wall-limits';
const DEFAULT_MESSAGE = 'Wish you were here!';
const FROM_KEY = 'ink-pigment:postcard-from';

const W = 1600;
const H = 1000;

/**
 * Builds a postcard PNG out of whatever the visitor has painted on the
 * current page. Sections register snapshot functions (see the
 * appPostcardSource directive); open() captures them and shows a preview
 * where the visitor adds a message, then downloads or shares the card.
 *
 * The visitor can also send the card to the site owner (send()), when the
 * backend is running: it is saved for review and, once approved in /admin,
 * shown on the postcard rack on the Contact page.
 */
@Injectable({ providedIn: 'root' })
export class Postcard {
  private readonly state = inject(PaintState);
  private readonly content = inject(ContentStore).content;
  private readonly sources = new Map<string, PostcardSource>();

  readonly isOpen = signal(false);
  /** Capturing the page's artwork. */
  readonly busy = signal(false);
  readonly lastMessage = signal('');
  readonly message = signal('');
  readonly from = signal(readFrom());
  readonly previewUrl = signal<string | null>(null);
  readonly canShare = signal(false);
  /** Sending needs the backend; without it the card can only be downloaded or shared. */
  readonly canSend = inject(ApiStatus).available;
  readonly sending = signal(false);
  readonly sendError = signal('');

  private images: CanvasImageSource[] = [];
  private blob: Blob | null = null;
  private renderId = 0;

  register(source: PostcardSource): () => void {
    this.sources.set(source.id, source);
    return () => this.sources.delete(source.id);
  }

  /** Captures what's painted on this page and opens the postcard preview. */
  async open(): Promise<void> {
    if (this.busy() || this.isOpen()) return;
    this.busy.set(true);
    try {
      // Canvas text only uses a web font once it is loaded, so load the card's fonts first.
      await Promise.all(
        ['500 54px "Caveat"', '600 54px "Caveat"', '600 60px "Fraunces"', '700 22px "DM Sans"'].map((f) =>
          document.fonts?.load(f).catch(() => null),
        ),
      );
      const sources = [...this.sources.values()].sort((a, b) => a.order - b.order);
      this.images = (await Promise.all(sources.map((s) => s.snapshot().catch(() => null))))
        .filter((img): img is CanvasImageSource => !!img)
        .slice(0, 3);
      this.isOpen.set(true);
      await this.render();
    } catch (err) {
      console.error(err);
      this.flash('Could not create the postcard — try again.');
      this.close();
    } finally {
      this.busy.set(false);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.sendError.set('');
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.blob = null;
    this.images = [];
  }

  /** Redraws the card, e.g. after the message or name changed. */
  async render(): Promise<void> {
    const id = ++this.renderId;
    const blob = await canvasToBlob(this.draw());
    if (id !== this.renderId || !this.isOpen()) return;
    this.blob = blob;
    const old = this.previewUrl();
    if (old) URL.revokeObjectURL(old);
    this.previewUrl.set(URL.createObjectURL(blob));
    this.canShare.set(!!navigator.canShare?.({ files: [this.file(blob)] }));
  }

  download(): void {
    if (!this.blob) return;
    downloadBlob(this.blob, this.filename());
    this.remember();
    this.flash('Postcard saved to your downloads');
    this.close();
  }

  async share(): Promise<void> {
    if (!this.blob) return;
    try {
      await navigator.share({
        files: [this.file(this.blob)],
        title: 'A hand-painted postcard',
        text: [`Greetings from ${cardTitle(this.content().name)}`, publicSite()].filter(Boolean).join(' — '),
      });
      this.remember();
      this.close();
    } catch {
      /* share sheet dismissed — keep the preview open */
    }
  }

  /** Sends the card to the site owner (kept private until they approve it). */
  async send(): Promise<void> {
    if (!this.blob || this.sending()) return;
    this.sending.set(true);
    this.sendError.set('');
    try {
      const res = await api('/postcards', {
        method: 'POST',
        body: {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          image: await toJpeg(this.blob),
          message: this.message().trim(),
          from: this.from().trim().slice(0, MAX_FROM),
        },
      });
      if (!res.ok) {
        this.sendError.set(res.reason);
        return;
      }
      this.remember();
      this.flash(`Postcard sent to ${realName(this.content().name) || 'the studio'}. Thank you!`);
      this.close();
    } catch {
      this.sendError.set('Could not send the postcard — please try again.');
    } finally {
      this.sending.set(false);
    }
  }

  /** The owner's name for buttons ("Send it to Priyalee"), or '' before it is set. */
  ownerName(): string {
    return realName(this.content().name);
  }

  // ----------------------------------------------------------- drawing

  private draw(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    // The card is printed on the theme's own paper, not on whatever colour
    // the visitor painted the page — that keeps the text readable.
    const { paper, paper2, ink, muted } = THEMES[this.state.theme()];
    const palette = this.state.palette();
    const now = new Date();

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // ---- Front: the painting(s)
    const art = { x: 72, y: 72, w: 900, h: H - 144 };
    if (this.images.length) {
      layout(this.images.length, art).forEach((box, i) => drawArtwork(ctx, this.images[i], box, ink));
    } else {
      drawFallbackArt(ctx, art, palette.colors.map((c) => c.hex), ink, paper2);
    }

    // ---- Back: dashed divider, stamp, heading, message, signature
    ctx.save();
    ctx.strokeStyle = muted;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(1024, 110);
    ctx.lineTo(1024, H - 110);
    ctx.stroke();
    ctx.restore();

    const col = { x: 1072, w: W - 72 - 1072 };
    const stamp = { x: W - 72 - 160, y: 72, w: 160, h: 186 };
    drawStamp(ctx, stamp, this.state.activeColor().hex, ink, paper);
    drawPostmark(ctx, stamp.x - 70, stamp.y + 118, now, ink);

    // Heading + message block, centred in the space under the stamp.
    const title = wrapText(ctx, cardTitle(this.content().name), col.w, 2, 60, '600', '"Fraunces", serif');
    const titleLine = title.size * 1.08;
    const ruleGap = 68;
    const rules = 4;
    const blockH = 38 + title.lines.length * titleLine + 118 + (rules - 1) * ruleGap;
    const top = stamp.y + stamp.h + 40;
    const bottom = H - 130;
    let y = top + Math.max(0, (bottom - top - blockH) / 2) + 22;

    ctx.fillStyle = muted;
    ctx.font = '700 22px "DM Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('GREETINGS FROM', col.x, y);
    ctx.letterSpacing = '0px';

    ctx.fillStyle = ink;
    ctx.font = `600 ${title.size}px "Fraunces", serif`;
    y += 8;
    for (const line of title.lines) {
      y += titleLine;
      ctx.fillText(line, col.x, y);
    }

    // Ruled writing lines with the handwritten message sitting on them.
    const firstRule = y + 118;
    ctx.strokeStyle = muted;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < rules; i++) {
      const ry = firstRule + i * ruleGap;
      ctx.beginPath();
      ctx.moveTo(col.x, ry);
      ctx.lineTo(col.x + col.w, ry);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const message = this.message().trim() || DEFAULT_MESSAGE;
    ctx.fillStyle = ink;
    const body = wrapText(ctx, message, col.w - 8, rules - 1, 60, '500', '"Caveat", cursive');
    body.lines.forEach((line, i) => ctx.fillText(line, col.x + 4, firstRule + i * ruleGap - 12));

    // Signature on the last ruled line, right-aligned.
    const from = this.from().trim();
    ctx.save();
    ctx.textAlign = 'right';
    fitText(ctx, `— ${from || 'a visitor'}`, col.x + col.w, firstRule + (rules - 1) * ruleGap - 12, col.w, 50, '600', '"Caveat", cursive');
    ctx.restore();

    // Address line: only a real, public address is printed (never localhost).
    const site = publicSite();
    if (site) {
      ctx.fillStyle = muted;
      ctx.font = '700 22px "DM Sans", sans-serif';
      ctx.letterSpacing = '2px';
      fitText(ctx, site.toUpperCase(), col.x, H - 84, col.w, 22, '700', '"DM Sans", sans-serif');
      ctx.letterSpacing = '0px';
    }

    return canvas;
  }

  // ----------------------------------------------------------- helpers

  private file(blob: Blob): File {
    return new File([blob], this.filename(), { type: 'image/png' });
  }

  private filename(): string {
    const name = realName(this.content().name);
    return `postcard-${name ? slug(name) : 'ink-pigment'}.png`;
  }

  private remember(): void {
    try {
      localStorage.setItem(FROM_KEY, this.from().trim().slice(0, MAX_FROM));
    } catch {
      /* ignore */
    }
  }

  private flash(text: string): void {
    this.lastMessage.set(text);
    setTimeout(() => this.lastMessage.set(''), 3000);
  }
}

/** The owner's name, or '' while the content still has the placeholder. */
function realName(name: string): string {
  const n = name.trim();
  return n && n.toLowerCase() !== PORTFOLIO.name.toLowerCase() ? n : '';
}

/** "Priyalee's portfolio", "James' portfolio", or the site name before a name is set. */
function cardTitle(name: string): string {
  const n = realName(name);
  if (!n) return 'the Ink & Pigment studio';
  return `${n}${/s$/i.test(n) ? "'" : "'s"} portfolio`;
}

/** The site's address for the card, or null on localhost / local network. */
function publicSite(): string | null {
  const host = location.hostname;
  const local =
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.test') ||
    host === '[::1]' ||
    /^(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) ||
    /^[\d.]+$/.test(host);
  return local || !host ? null : host.replace(/^www\./, '');
}

/** A smaller JPEG copy of the card for sending (keeps uploads around 150–400 KB). */
async function toJpeg(png: Blob): Promise<string> {
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = Math.round((bitmap.height / bitmap.width) * 1280);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

function readFrom(): string {
  try {
    return localStorage.getItem(FROM_KEY) ?? '';
  } catch {
    return '';
  }
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'portfolio';
}
