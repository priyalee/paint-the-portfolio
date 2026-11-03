import { Injectable, inject, signal } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { ExperienceItem, Portfolio, Project } from '@data/portfolio.data';

export interface EditorMessage {
  kind: 'ok' | 'error';
  text: string;
}

/**
 * Shared state for one open editor: the mutable working copy every tab edits,
 * list helpers, and the status message. Provided by ContentEditor, so each
 * tab component simply injects it.
 */
@Injectable()
export class EditorSession {
  private readonly store = inject(ContentStore);

  /** Mutable working copy the forms edit; pushed to the store on every change. */
  readonly work = signal<Portfolio>(structuredClone(this.store.content()));
  readonly message = signal<EditorMessage | null>(null);

  /** Re-read the store (on open, after import, after discarding the draft). */
  reload(): void {
    this.work.set(structuredClone(this.store.content()));
  }

  /** Called after every form change: live preview + autosaved draft. */
  changed(): void {
    this.store.preview(structuredClone(this.work()));
  }

  add<T>(list: T[], item: T): void {
    list.push(item);
    this.refresh();
  }

  remove<T>(list: T[], i: number): void {
    list.splice(i, 1);
    this.refresh();
  }

  move<T>(list: T[], i: number, dir: -1 | 1): void {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.refresh();
  }

  /** Splits "Angular, TypeScript" into ['Angular', 'TypeScript'] (applied on blur). */
  setTech(p: Project, raw: string): void {
    p.tech = splitBy(raw, /,/);
    this.changed();
  }

  /** One highlight per line (applied on blur). */
  setHighlights(e: ExperienceItem, raw: string): void {
    e.highlights = splitBy(raw, /\n/);
    this.changed();
  }

  flash(kind: EditorMessage['kind'], text: string): void {
    this.message.set({ kind, text });
    setTimeout(() => {
      if (this.message()?.text === text) this.message.set(null);
    }, 6000);
  }

  /** Lists were mutated in place — hand templates a new object reference. */
  private refresh(): void {
    this.work.update((w) => ({ ...w }));
    this.changed();
  }
}

function splitBy(raw: string, sep: RegExp): string[] {
  return raw
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}
