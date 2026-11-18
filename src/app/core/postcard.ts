import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { ApiStatus, api } from '@core/api';
import { ContentStore } from '@core/content-store';
import { PaintState } from '@core/paint-state';
import { PaletteColor, THEMES } from '@core/palettes';
import { CARD, CardColours, drawBack, drawFront, stackSides } from '@core/postcard-sides';
import { canvasToBlob, downloadBlob } from '@core/snapshot';
import { HEX_COLOR, MAX_FROM, MAX_MESSAGE, MAX_MESSAGE_LINES } from '@core/wall-limits';

export interface PostcardSource {
  id: string;
  /** Lower comes first; the first source gets the biggest panel. */
  order: number;
  snapshot: () => Promise<CanvasImageSource | null>;
}

export type CardPaper = 'light' | 'dark';
export type CardSide = 'front' | 'back';

export { MAX_FROM, MAX_MESSAGE, MAX_MESSAGE_LINES } from '@core/wall-limits';
export const DEFAULT_MESSAGE = 'Wish you were here!';
const FROM_KEY = 'ink-pigment:postcard-from';
/** The name the content starts with, before the owner fills in their own. */
const PLACEHOLDER_NAME = 'your name';

/**
 * Builds a two-sided postcard out of whatever the visitor has painted on the
 * current page. Sections register snapshot functions (see the
 * appPostcardSource directive); open() captures them and shows a preview.
 *
 * Front: the painting with a "Greetings from" banner.
 * Back: the visitor's message, a stamp in a colour they pick, and the
 * owner's address. The card can be printed on light or dark paper.
 *
 * The visitor can download both sides, share them, or send the card to the
 * site owner (when the backend is running): it is saved for review and,
 * once approved in /admin, shown on the postcard rack on the Contact page.
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
  readonly paper = signal<CardPaper>('light');
  readonly stamp = signal('#F2420F');
  /** Which side the preview shows. */
  readonly side = signal<CardSide>('front');

  readonly frontUrl = signal<string | null>(null);
  readonly backUrl = signal<string | null>(null);
  readonly ready = computed(() => !!this.frontUrl() && !!this.backUrl());

  /** Stamp colours on offer: the visitor's current palette. */
  readonly stampColours = computed<readonly PaletteColor[]>(() => this.state.palette().colors);
  /** The owner's name for buttons ("Send it to Priyalee"), or '' before it is set. */
  readonly ownerName = computed(() => firstName(this.content().name));

  readonly canShare = signal(false);
  /** Sending needs the backend; without it the card can only be downloaded or shared. */
  readonly canSend = inject(ApiStatus).available;
  readonly sending = signal(false);
  readonly sendError = signal('');

  private images: CanvasImageSource[] = [];
  private front: HTMLCanvasElement | null = null;
  private back: HTMLCanvasElement | null = null;
  private frontBlob: Blob | null = null;
  private backBlob: Blob | null = null;
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
      // Start from the page as it is now: its paper and the colour in hand.
      this.paper.set(this.state.theme() === 'chalk' ? 'dark' : 'light');
      this.stamp.set(this.state.activeColor().hex);
      this.side.set('front');
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
    for (const url of [this.frontUrl(), this.backUrl()]) if (url) URL.revokeObjectURL(url);
    this.frontUrl.set(null);
    this.backUrl.set(null);
    this.front = this.back = null;
    this.frontBlob = this.backBlob = null;
    this.images = [];
  }

  // ----------------------------------------------------------- editing

  /** Keeps the message within the length and line limits. */
  setMessage(value: string): string {
    const clean = value.replace(/\r\n?/g, '\n').split('\n').slice(0, MAX_MESSAGE_LINES).join('\n').slice(0, MAX_MESSAGE);
    this.message.set(clean);
    return clean;
  }

  setPaper(paper: CardPaper): void {
    if (paper === this.paper()) return;
    this.paper.set(paper);
    void this.render();
  }

  setStamp(hex: string): void {
    if (!HEX_COLOR.test(hex)) return;
    this.stamp.set(hex.toUpperCase());
    this.side.set('back');
    void this.render('back');
  }

  // ----------------------------------------------------------- rendering

  /** Redraws the card. Only the back changes when the message, name or stamp do. */
  async render(which: 'both' | 'back' = 'both'): Promise<void> {
    const id = ++this.renderId;
    const colours = this.colours();
    const front = which === 'both' || !this.front ? this.drawSide((ctx) => this.drawFrontSide(ctx, colours)) : this.front;
    const back = this.drawSide((ctx) => this.drawBackSide(ctx, colours));
    const [frontBlob, backBlob] = await Promise.all([
      front === this.front && this.frontBlob ? this.frontBlob : canvasToBlob(front),
      canvasToBlob(back),
    ]);
    if (id !== this.renderId || !this.isOpen()) return;

    if (front !== this.front || !this.frontUrl()) {
      this.front = front;
      this.frontBlob = frontBlob;
      swapUrl(this.frontUrl, frontBlob);
    }
    this.back = back;
    this.backBlob = backBlob;
    swapUrl(this.backUrl, backBlob);
    this.canShare.set(!!navigator.canShare?.({ files: this.files() }));
  }

  // ----------------------------------------------------------- actions

  /** Saves one PNG with the front above the back. */
  async download(): Promise<void> {
    if (!this.front || !this.back) return;
    downloadBlob(await canvasToBlob(stackSides(this.front, this.back)), `${this.basename()}.png`);
    this.remember();
    this.flash('Postcard saved to your downloads');
    this.close();
  }

  async share(): Promise<void> {
    if (!this.frontBlob || !this.backBlob) return;
    try {
      await navigator.share({
        files: this.files(),
        title: 'A hand-painted postcard',
        text: [`Greetings from ${cardTitle(this.content().name)}`, publicSite()].filter(Boolean).join(' — '),
      });
      this.remember();
      this.close();
    } catch {
      /* share sheet dismissed — keep the preview open */
    }
  }

  /** Sends both sides to the site owner (kept private until they approve it). */
  async send(): Promise<void> {
    if (!this.front || !this.back || this.sending()) return;
    this.sending.set(true);
    this.sendError.set('');
    try {
      const res = await api('/postcards', {
        method: 'POST',
        body: {
          id: crypto.randomUUID?.() ?? String(Date.now()),
          image: toJpeg(this.front),
          back: toJpeg(this.back),
          message: this.message().trim(),
          from: this.from().trim().slice(0, MAX_FROM),
        },
      });
      if (!res.ok) {
        this.sendError.set(res.reason);
        return;
      }
      this.remember();
      this.flash(`Postcard sent to ${this.ownerName() || 'the studio'}. Thank you!`);
      this.close();
    } catch {
      this.sendError.set('Could not send the postcard — please try again.');
    } finally {
      this.sending.set(false);
    }
  }

  // ----------------------------------------------------------- drawing

  private colours(): CardColours {
    return THEMES[this.paper() === 'dark' ? 'chalk' : 'paper'];
  }

  private drawSide(paint: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = CARD.w;
    canvas.height = CARD.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    paint(ctx);
    return canvas;
  }

  private drawFrontSide(ctx: CanvasRenderingContext2D, colours: CardColours): void {
    drawFront(ctx, colours, {
      images: this.images,
      title: cardTitle(this.content().name),
      site: publicSite(),
    });
  }

  private drawBackSide(ctx: CanvasRenderingContext2D, colours: CardColours): void {
    const c = this.content();
    const name = realName(c.name);
    drawBack(ctx, colours, {
      message: this.message().trim() || DEFAULT_MESSAGE,
      from: this.from().trim() || 'a visitor',
      stamp: this.stamp(),
      stampLabel: name && c.initials.trim() ? [c.initials.trim().slice(0, 3)] : ["Priyalee's", 'Studio'],
      to: name ? [name, c.role, publicSite() ?? ''] : ["Priyalee's Studio", '', publicSite() ?? ''],
      date: new Date(),
    });
  }

  // ----------------------------------------------------------- helpers

  private files(): File[] {
    if (!this.frontBlob || !this.backBlob) return [];
    const base = this.basename();
    return [
      new File([this.frontBlob], `${base}-front.png`, { type: 'image/png' }),
      new File([this.backBlob], `${base}-back.png`, { type: 'image/png' }),
    ];
  }

  private basename(): string {
    const name = realName(this.content().name);
    return `postcard-${name ? slug(name) : 'priyalees-studio'}`;
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
  return n && n.toLowerCase() !== PLACEHOLDER_NAME ? n : '';
}

function firstName(name: string): string {
  return realName(name).split(/\s+/)[0] ?? '';
}

/** "Priyalee Dahiya's portfolio", "James' portfolio", or the site name before a name is set. */
function cardTitle(name: string): string {
  const n = realName(name);
  if (!n) return "Priyalee's Studio";
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

/** Replaces a preview object URL, freeing the old one. */
function swapUrl(target: WritableSignal<string | null>, blob: Blob): void {
  const old = target();
  target.set(URL.createObjectURL(blob));
  if (old) URL.revokeObjectURL(old);
}

/** A smaller JPEG copy of one side for sending (about 100–300 KB). */
function toJpeg(side: HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = Math.round((side.height / side.width) * 1280);
  canvas.getContext('2d')?.drawImage(side, 0, 0, canvas.width, canvas.height);
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
