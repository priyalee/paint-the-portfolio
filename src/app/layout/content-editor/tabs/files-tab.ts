import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContentStore } from '@core/content-store';
import { downloadBlob } from '@core/snapshot';
import { Icon } from '@shared/ui/icon';
import { buildContentTemplate } from '../content-template';
import { EditorSession } from '../editor-session';

/** Editor tab: fill-in template, import/export content.json, discard draft. */
@Component({
  selector: 'app-files-tab',
  imports: [FormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../editor-form.scss',
  template: `
    <section class="card-block">
      <h3>1 · Fill everything at once</h3>
      <ol class="steps">
        <li>Click <strong>Copy template</strong>.</li>
        <li>
          Paste it into any text editor and fill in your details. The field guide at the top
          explains each part.
        </li>
        <li>Paste the filled-in template below and press <strong>Apply</strong>.</li>
      </ol>
      <button type="button" class="btn" (click)="copyTemplate()">
        <app-icon name="copy" /> Copy template
      </button>
    </section>

    <section class="card-block">
      <h3>2 · Paste / import JSON</h3>
      <textarea
        class="mono"
        rows="8"
        placeholder="Paste the filled-in template or a content.json here…"
        [ngModel]="importText()"
        (ngModelChange)="importText.set($event)"
      ></textarea>
      <div class="row wrap">
        <button type="button" class="btn" (click)="applyImport()" [disabled]="!importText().trim()">
          Apply
        </button>
        <label class="btn btn-ghost file">
          Load .json file
          <input type="file" accept="application/json,.json" (change)="loadFile($event)" />
        </label>
      </div>
    </section>

    <section class="card-block">
      <h3>3 · Publish</h3>
      <p class="tip">
        Edits are a draft in <em>this browser only</em>. To put them live for everyone, download
        <code>content.json</code> and replace <code>public/content.json</code> in the project (or
        upload it to your host). No code changes needed.
      </p>
      <div class="row wrap">
        <button type="button" class="btn" (click)="download()">
          <app-icon name="download" /> Download content.json
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          (click)="discard()"
          [disabled]="!store.hasDraft()"
        >
          <app-icon name="reset" /> Discard draft
        </button>
      </div>
    </section>
  `,
})
export class FilesTab {
  protected readonly store = inject(ContentStore);
  private readonly session = inject(EditorSession);
  protected readonly importText = signal('');

  protected async copyTemplate(): Promise<void> {
    const text = buildContentTemplate(this.store.content());
    try {
      await navigator.clipboard.writeText(text);
      this.session.flash('ok', 'Template copied! Fill it in, then paste it back below.');
    } catch {
      this.importText.set(text);
      this.session.flash('error', 'Clipboard blocked — the template is in the box below, copy it from there.');
    }
  }

  protected applyImport(): void {
    const result = this.store.importJson(this.importText());
    if (result.ok) {
      this.session.reload();
      this.importText.set('');
      this.session.flash('ok', 'Applied! Check the site behind this panel.');
    } else {
      this.session.flash('error', result.error);
    }
  }

  protected async loadFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.importText.set(await file.text());
    this.applyImport();
  }

  protected download(): void {
    downloadBlob(new Blob([this.store.exportJson()], { type: 'application/json' }), 'content.json');
    this.session.flash('ok', 'Downloaded content.json — replace public/content.json with it to publish.');
  }

  protected discard(): void {
    this.store.discardDraft();
    this.session.reload();
    this.session.flash('ok', 'Draft discarded — showing the published content again.');
  }
}
