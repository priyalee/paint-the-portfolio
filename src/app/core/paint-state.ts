import {
  ApplicationRef,
  DOCUMENT,
  Injectable,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { PALETTES, SLOT_COUNT, THEMES } from '@core/palettes';

export type PaintScope = 'site' | 'studio';
export type Tool = 'bucket' | 'roller' | 'eraser';

/** Region id used for the whole-screen background paint. */
export const PAGE_BG = '@page';
export type ColorMode = 'mono' | 'color';
export type Theme = 'paper' | 'chalk';

interface ChangeEntry {
  key: string;
  prev: number | null;
  next: number | null;
}
type Change = ChangeEntry[];

interface Persisted {
  mode?: ColorMode;
  theme?: Theme;
  palette?: number;
  fills?: Record<string, number>;
}

const STORAGE_KEY = 'ink-pigment:v1';
const MAX_HISTORY = 200;

/**
 * Single source of truth for everything paint related:
 * mono/colour mode, paper/chalk theme, palette, selected pigment, tool,
 * which regions are filled, undo/redo and progress.
 */
@Injectable({ providedIn: 'root' })
export class PaintState {
  private readonly doc = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly saved = readStorage();

  readonly mode = signal<ColorMode>(this.saved.mode === 'color' ? 'color' : 'mono');
  readonly theme = signal<Theme>(
    this.saved.theme === 'chalk' || this.saved.theme === 'paper'
      ? this.saved.theme
      : prefersDark()
        ? 'chalk'
        : 'paper',
  );
  readonly paletteIndex = signal(clampIndex(this.saved.palette ?? 0, PALETTES.length));
  readonly palette = computed(() => PALETTES[this.paletteIndex()]);
  readonly slot = signal(0);
  readonly tool = signal<Tool>('bucket');
  readonly activeColor = computed(() => this.palette().colors[this.slot()]);

  private readonly fills = signal<Record<string, number>>(sanitizeFills(this.saved.fills));
  private readonly undoStack = signal<Change[]>([]);
  private readonly redoStack = signal<Change[]>([]);
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  /** Pigment slot the whole screen is painted with (null = plain paper / chalk). */
  readonly background = computed(() => this.fills()[key('site', PAGE_BG)] ?? null);

  /** Region ids that exist on screen (or have existed this session), per scope. */
  private readonly registry = new Map<PaintScope, Set<string>>();
  private readonly known = new Map<PaintScope, Set<string>>();
  private readonly registryVersion = signal(0);
  private flushQueued = false;

  readonly siteProgress = computed(() => this.progressFor('site'));

  constructor() {
    effect(() => this.applyRootDom());
    effect(() =>
      writeStorage({
        mode: this.mode(),
        theme: this.theme(),
        palette: this.paletteIndex(),
        fills: this.fills(),
      }),
    );
  }

  // ---------------------------------------------------------------- regions

  fillOf(scope: PaintScope, id: string): number | undefined {
    return this.fills()[key(scope, id)];
  }

  register(scope: PaintScope, id: string): void {
    let set = this.registry.get(scope);
    if (!set) this.registry.set(scope, (set = new Set()));
    if (set.has(id)) return;
    set.add(id);
    // Many regions register in one render pass; bump the signal once.
    if (!this.flushQueued) {
      this.flushQueued = true;
      queueMicrotask(() => {
        this.flushQueued = false;
        this.registryVersion.update((v) => v + 1);
      });
    }
  }

  /**
   * Declares the complete list of region ids for a scope, so progress is
   * correct even for pages that haven't been opened yet.
   */
  setKnown(scope: PaintScope, ids: string[]): void {
    this.known.set(scope, new Set(ids));
    this.registryVersion.update((v) => v + 1);
  }

  /** Fraction (0-1) of regions in `scope` (optionally under `prefix`) that are painted. */
  progressFor(scope: PaintScope, prefix = ''): { painted: number; total: number; ratio: number } {
    this.registryVersion();
    const fills = this.fills();
    const source = this.known.get(scope) ?? this.registry.get(scope) ?? [];
    const ids = [...source].filter((id) => id.startsWith(prefix));
    const painted = ids.filter((id) => fills[key(scope, id)] !== undefined).length;
    return { painted, total: ids.length, ratio: ids.length ? painted / ids.length : 0 };
  }

  apply(scope: PaintScope, id: string, slot: number | null): void {
    const k = key(scope, id);
    const prev = this.fills()[k] ?? null;
    if (prev === slot) return;
    this.commit([{ key: k, prev, next: slot }]);
  }

  /** Clears every region in `scope` whose id starts with `prefix`. Undoable. */
  reset(scope: PaintScope, prefix = ''): void {
    const start = key(scope, prefix);
    const change: Change = Object.entries(this.fills())
      .filter(([k]) => k.startsWith(start))
      .map(([k, prev]) => ({ key: k, prev, next: null }));
    if (change.length) this.commit(change);
  }

  undo(): void {
    const stack = this.undoStack();
    const change = stack.at(-1);
    if (!change) return;
    this.undoStack.set(stack.slice(0, -1));
    this.redoStack.update((r) => [...r, change]);
    this.write(change.map((c) => ({ ...c, next: c.prev })));
  }

  redo(): void {
    const stack = this.redoStack();
    const change = stack.at(-1);
    if (!change) return;
    this.redoStack.set(stack.slice(0, -1));
    this.undoStack.update((u) => [...u, change]);
    this.write(change);
  }

  private commit(change: Change): void {
    this.undoStack.update((u) => [...u, change].slice(-MAX_HISTORY));
    this.redoStack.set([]);
    this.write(change);
  }

  private write(change: Change): void {
    this.fills.update((f) => {
      const next = { ...f };
      for (const c of change) {
        if (c.next === null) delete next[c.key];
        else next[c.key] = c.next;
      }
      return next;
    });
  }

  // ------------------------------------------------------------ tools / UI

  selectSlot(i: number): void {
    this.slot.set(clampIndex(i, SLOT_COUNT));
    if (this.tool() === 'eraser') this.tool.set('bucket');
  }

  setTool(tool: Tool): void {
    this.tool.set(tool);
  }

  setPalette(i: number): void {
    this.paletteIndex.set(clampIndex(i, PALETTES.length));
  }

  /** "New mood": jump to a random *different* palette. */
  shufflePalette(): void {
    const current = this.paletteIndex();
    let next = current;
    while (next === current) next = Math.floor(Math.random() * PALETTES.length);
    this.paletteIndex.set(next);
  }

  hex(slot: number): string {
    return this.palette().colors[clampIndex(slot, SLOT_COUNT)].hex;
  }

  toggleMode(event?: Event): void {
    this.sweep(originOf(event), () => this.mode.update((m) => (m === 'mono' ? 'color' : 'mono')));
  }

  toggleTheme(event?: Event): void {
    this.sweep(originOf(event), () => this.theme.update((t) => (t === 'paper' ? 'chalk' : 'paper')));
  }

  /**
   * Floods the entire screen with a pigment (null = back to plain paper),
   * sweeping out from `origin` — a click point or the element clicked. Undoable.
   */
  paintBackground(slot: number | null, origin?: Event | { x: number; y: number }): void {
    if (this.background() === slot) return;
    const point = origin && 'x' in origin ? origin : originOf(origin);
    this.sweep(point, () => this.apply('site', PAGE_BG, slot));
  }

  /**
   * Runs `change` inside a View Transition and reveals the new state with a
   * circle growing from the element that triggered it.
   */
  private sweep(origin: { x: number; y: number } | null, change: () => void): void {
    const doc = this.doc;
    if (!('startViewTransition' in doc) || reducedMotion() || !origin) {
      change();
      return;
    }
    const { x, y } = origin;
    const w = doc.defaultView?.innerWidth ?? 0;
    const h = doc.defaultView?.innerHeight ?? 0;
    const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));

    const transition = doc.startViewTransition(() => {
      change();
      this.applyRootDom();
      this.appRef.tick();
    });
    transition.ready
      .then(() => {
        doc.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          {
            duration: 800,
            easing: 'cubic-bezier(.7,0,.25,1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => undefined);
  }

  /** Mirrors mode / theme / palette / tool onto <html> as classes + CSS variables. */
  private applyRootDom(): void {
    const root = this.doc.documentElement;
    const colors = this.palette().colors;
    const theme = surfaceFor(THEMES[this.theme()], this.theme(), this.background(), colors);
    root.classList.toggle('mode-color', this.mode() === 'color');
    root.classList.toggle('theme-chalk', this.theme() === 'chalk');
    root.classList.toggle('bg-painted', this.background() !== null);
    root.classList.toggle('tool-eraser', this.tool() === 'eraser');
    root.classList.toggle('tool-roller', this.tool() === 'roller');
    root.style.setProperty('--paper', theme.paper);
    root.style.setProperty('--paper-2', theme.paper2);
    root.style.setProperty('--ink', theme.ink);
    root.style.setProperty('--muted', theme.muted);
    root.style.colorScheme = luminance(theme.paper) < 0.25 ? 'dark' : 'light';
    colors.forEach((c, i) => root.style.setProperty(`--p${i}`, c.hex));

    // Accent = first pigment that stays readable on the current paper.
    let accent: string = theme.ink;
    let onAccent: string = theme.paper;
    if (this.mode() === 'color') {
      const paperL = luminance(theme.paper);
      const readable = colors.filter((c) => contrast(luminance(c.hex), paperL) >= 3);
      // On a painted screen no pigment may be readable — then the accent stays ink.
      const pick = readable[0];
      if (pick) {
        accent = pick.hex;
        onAccent = luminance(pick.hex) > 0.35 ? '#161513' : '#FFFFFF';
      }
    }
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--on-accent', onAccent);
  }
}

// ------------------------------------------------------------------ helpers

function key(scope: PaintScope, id: string): string {
  return `${scope}:${id}`;
}

function clampIndex(i: number, length: number): number {
  return Number.isInteger(i) && i >= 0 && i < length ? i : 0;
}

function sanitizeFills(input: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== 'object') return out;
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < SLOT_COUNT) out[k] = v;
  }
  return out;
}

function readStorage(): Persisted {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Persisted) : {};
  } catch {
    return {};
  }
}

function writeStorage(value: Persisted): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode etc.) – painting still works in-memory */
  }
}

function prefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

const DARK_INK = '#161513';
const LIGHT_INK = '#F4F1EA';

interface Surface {
  paper: string;
  paper2: string;
  ink: string;
  muted: string;
}

/**
 * Paper / ink colours for the current theme, or — when the screen is painted —
 * a light tint (paper theme) or deep shade (chalk theme) of that pigment with
 * whichever ink reads best on it.
 */
function surfaceFor(
  base: Surface,
  theme: Theme,
  bg: number | null,
  colors: readonly { hex: string }[],
): Surface {
  if (bg === null || !colors[bg]) return base;
  const pigment = colors[bg].hex;
  const paper = theme === 'chalk' ? mix(pigment, '#0E0E0C', 0.42) : mix(pigment, '#FFFFFF', 0.72);
  const pl = luminance(paper);
  const ink =
    contrast(luminance(DARK_INK), pl) >= contrast(luminance(LIGHT_INK), pl) ? DARK_INK : LIGHT_INK;
  return { paper, paper2: mix(ink, paper, 0.08), ink, muted: mix(ink, paper, 0.7) };
}

/** Linear sRGB mix: t of `a` + (1 - t) of `b`. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * t + ((pb >> shift) & 255) * (1 - t));
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Centre of the element an event came from, or its pointer position. */
function originOf(event?: Event): { x: number; y: number } | null {
  const target = event?.currentTarget as HTMLElement | null;
  if (target?.getBoundingClientRect) {
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (event instanceof MouseEvent) return { x: event.clientX, y: event.clientY };
  return null;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function reducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
