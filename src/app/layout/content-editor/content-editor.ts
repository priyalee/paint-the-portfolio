import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ContentStore } from '@core/content-store';
import { Icon } from '@shared/ui/icon';
import { EditorSession } from './editor-session';
import { AboutTab } from './tabs/about-tab';
import { FilesTab } from './tabs/files-tab';
import { BasicsTab } from './tabs/basics-tab';
import { JourneyTab } from './tabs/journey-tab';
import { LinksTab } from './tabs/links-tab';
import { ProjectsTab } from './tabs/projects-tab';
import { SkillsTab } from './tabs/skills-tab';

type Tab = 'basics' | 'about' | 'skills' | 'projects' | 'journey' | 'links' | 'files';

/**
 * Hidden content editor shell (panel, tabs, status). Each tab is its own
 * component in ./tabs and shares state through EditorSession.
 *
 * Open with Ctrl+Alt+E, the faint edit icon in the footer, or ?edit in the URL.
 * Edits live-preview and autosave as a draft in this browser only.
 */
@Component({
  selector: 'app-content-editor',
  imports: [Icon, BasicsTab, AboutTab, SkillsTab, ProjectsTab, JourneyTab, LinksTab, FilesTab],
  providers: [EditorSession],
  templateUrl: './content-editor.html',
  styleUrl: './content-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKey($event)',
  },
})
export class ContentEditor {
  protected readonly store = inject(ContentStore);
  protected readonly session = inject(EditorSession);

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'basics', label: 'Basics' },
    { id: 'about', label: 'About' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'journey', label: 'Journey' },
    { id: 'links', label: 'Links' },
    { id: 'files', label: 'Import & export' },
  ];
  protected readonly tab = signal<Tab>('basics');

  constructor() {
    // Fresh working copy each time the panel opens.
    effect(() => {
      if (this.store.editorOpen()) this.session.reload();
    });
    if (new URLSearchParams(location.search).has('edit')) this.store.editorOpen.set(true);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      this.store.editorOpen.update((o) => !o);
    } else if (e.key === 'Escape' && this.store.editorOpen()) {
      this.close();
    }
  }

  protected close(): void {
    this.store.editorOpen.set(false);
  }
}
