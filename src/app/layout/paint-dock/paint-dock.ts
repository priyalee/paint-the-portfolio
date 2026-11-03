import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PaintState } from '@core/paint-state';
import { Postcard } from '@core/postcard';
import { Icon } from '@shared/ui/icon';

/**
 * Floating palette dock: tools, six pigments, "new mood" palette shuffle,
 * undo/redo and the postcard export. Keyboard: 1-6 pigments, B bucket,
 * E eraser, M new mood, Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z redo.
 */
@Component({
  selector: 'app-paint-dock',
  imports: [Icon],
  templateUrl: './paint-dock.html',
  styleUrl: './paint-dock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'collapsed()',
    '(document:keydown)': 'onKey($event)',
    '(document:click)': 'onPageClick($event)',
  },
})
export class PaintDock {
  protected readonly state = inject(PaintState);
  protected readonly postcard = inject(Postcard);
  protected readonly collapsed = signal(false);
  protected readonly moodFlash = signal(false);
  protected readonly hint = signal('');
  private hintTimer?: ReturnType<typeof setTimeout>;

  /** Roller: click any empty spot on the page to flood the whole screen. */
  protected useRoller(): void {
    this.state.setTool('roller');
    this.showHint('Roller ready — click any empty spot on the page to paint the whole screen');
  }

  protected onPageClick(e: MouseEvent): void {
    const tool = this.state.tool();
    if (tool === 'bucket') return;
    const target = e.target as Element | null;
    // Only empty page areas count — never links, controls, shapes, canvases or overlays.
    if (
      !target ||
      target.closest(
        'a, button, input, textarea, select, label, canvas, dialog, .paintable, app-paint-dock, app-content-editor, app-celebration-layer, app-navbar, app-splash-canvas, app-mural-canvas',
      )
    ) {
      return;
    }
    if (tool === 'roller') this.state.paintBackground(this.state.slot(), { x: e.clientX, y: e.clientY });
    else if (this.state.background() !== null) this.state.paintBackground(null, { x: e.clientX, y: e.clientY });
  }

  private showHint(text: string): void {
    clearTimeout(this.hintTimer);
    this.hint.set(text);
    this.hintTimer = setTimeout(() => this.hint.set(''), 3500);
  }

  protected shuffle(): void {
    this.state.shufflePalette();
    this.moodFlash.set(true);
    setTimeout(() => this.moodFlash.set(false), 700);
  }

  protected onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.state.redo();
      else this.state.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && k === 'y') {
      e.preventDefault();
      this.state.redo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-6]$/.test(k)) this.state.selectSlot(Number(k) - 1);
    else if (k === 'b') this.state.setTool('bucket');
    else if (k === 'r') this.useRoller();
    else if (k === 'e') this.state.setTool('eraser');
    else if (k === 'm') this.shuffle();
  }
}
