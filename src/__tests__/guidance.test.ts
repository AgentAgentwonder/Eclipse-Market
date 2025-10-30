import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useTutorialStore } from '../store/tutorialStore';
import { useHelpStore } from '../store/helpStore';
import { useChangelogStore } from '../store/changelogStore';

describe('Tutorial Engine', () => {
  beforeEach(() => {
    const store = useTutorialStore.getState();
    store.resetAllProgress();
    store.stopTutorial();
  });

  it('should start a tutorial', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials[0];

    act(() => {
      store.startTutorial(tutorial.id);
    });

    expect(store.activeTutorialId).toBe(tutorial.id);
    expect(store.currentStep).toBe(0);
    expect(store.isPlaying).toBe(true);
  });

  it('should navigate through tutorial steps', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials[0];

    act(() => {
      store.startTutorial(tutorial.id);
    });

    expect(store.currentStep).toBe(0);

    act(() => {
      store.nextStep();
    });

    expect(store.currentStep).toBe(1);

    act(() => {
      store.previousStep();
    });

    expect(store.currentStep).toBe(0);
  });

  it('should complete a tutorial', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials.find(t => t.steps.length === 1);
    if (!tutorial) return;

    act(() => {
      store.startTutorial(tutorial.id);
      store.completeTutorial();
    });

    const progress = store.getTutorialProgress(tutorial.id);
    expect(progress?.completed).toBe(true);
    expect(store.isPlaying).toBe(false);
  });

  it('should skip a tutorial', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials[0];

    act(() => {
      store.startTutorial(tutorial.id);
      store.skipTutorial();
    });

    const progress = store.getTutorialProgress(tutorial.id);
    expect(progress?.skipped).toBe(true);
    expect(store.isPlaying).toBe(false);
  });

  it('should reset tutorial progress', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials[0];

    act(() => {
      store.startTutorial(tutorial.id);
      store.completeTutorial();
    });

    expect(store.getTutorialProgress(tutorial.id)).toBeTruthy();

    act(() => {
      store.resetTutorial(tutorial.id);
    });

    expect(store.getTutorialProgress(tutorial.id)).toBeFalsy();
  });

  it('should filter available tutorials by page', () => {
    const store = useTutorialStore.getState();

    const allTutorials = store.getAvailableTutorials();
    expect(allTutorials.length).toBeGreaterThan(0);

    const tradingTutorials = store.getAvailableTutorials('trading');
    const hasRequiredPageFilter = tradingTutorials.every(
      t => t.requiredPages.length === 0 || t.requiredPages.includes('trading')
    );
    expect(hasRequiredPageFilter).toBe(true);
  });

  it('should track progress across sessions', () => {
    const store = useTutorialStore.getState();
    const tutorial = store.tutorials[0];

    act(() => {
      store.startTutorial(tutorial.id);
      store.nextStep();
      store.nextStep();
      store.completeTutorial();
    });

    const progress = store.getTutorialProgress(tutorial.id);
    expect(progress).toBeTruthy();
    expect(progress?.completed).toBe(true);
    expect(progress?.lastUpdated).toBeTruthy();
  });

  it('should toggle autoStart setting', () => {
    const store = useTutorialStore.getState();

    expect(store.autoStart).toBe(true);

    act(() => {
      store.setAutoStart(false);
    });

    expect(store.autoStart).toBe(false);
  });
});

describe('Help System', () => {
  beforeEach(() => {
    const store = useHelpStore.getState();
    store.closePanel();
    store.exitWhatsThisMode();
  });

  it('should open help panel', () => {
    const store = useHelpStore.getState();

    expect(store.isPanelOpen).toBe(false);

    act(() => {
      store.openPanel();
    });

    expect(store.isPanelOpen).toBe(true);
  });

  it('should open help panel with section and item', () => {
    const store = useHelpStore.getState();
    const section = store.content.sections[0];
    const item = section.items[0];

    act(() => {
      store.openPanel(section.id, item.id);
    });

    expect(store.isPanelOpen).toBe(true);
    expect(store.activeSectionId).toBe(section.id);
    expect(store.activeItemId).toBe(item.id);
  });

  it('should close help panel', () => {
    const store = useHelpStore.getState();

    act(() => {
      store.openPanel();
    });

    expect(store.isPanelOpen).toBe(true);

    act(() => {
      store.closePanel();
    });

    expect(store.isPanelOpen).toBe(false);
  });

  it('should find sections by id', () => {
    const store = useHelpStore.getState();
    const section = store.content.sections[0];

    const found = store.getSectionById(section.id);
    expect(found).toBeTruthy();
    expect(found?.id).toBe(section.id);
  });

  it('should find items by id', () => {
    const store = useHelpStore.getState();
    const section = store.content.sections[0];
    const item = section.items[0];

    const found = store.getItemById(item.id);
    expect(found).toBeTruthy();
    expect(found?.id).toBe(item.id);
  });

  it('should enter whats this mode', () => {
    const store = useHelpStore.getState();

    expect(store.whatsThisMode).toBe(false);

    act(() => {
      store.enterWhatsThisMode();
    });

    expect(store.whatsThisMode).toBe(true);
  });

  it('should exit whats this mode', () => {
    const store = useHelpStore.getState();

    act(() => {
      store.enterWhatsThisMode();
    });

    expect(store.whatsThisMode).toBe(true);

    act(() => {
      store.exitWhatsThisMode();
    });

    expect(store.whatsThisMode).toBe(false);
  });

  it('should handle search query', () => {
    const store = useHelpStore.getState();

    act(() => {
      store.setSearchQuery('dashboard');
    });

    expect(store.searchQuery).toBe('dashboard');

    act(() => {
      store.closePanel();
    });

    expect(store.searchQuery).toBe('');
  });
});

describe('Changelog Viewer', () => {
  beforeEach(() => {
    const store = useChangelogStore.getState();
    store.closeViewer();
    store.clearFilters();
  });

  it('should open changelog viewer', () => {
    const store = useChangelogStore.getState();

    expect(store.isViewerOpen).toBe(false);

    act(() => {
      store.openViewer();
    });

    expect(store.isViewerOpen).toBe(true);
  });

  it('should close changelog viewer', () => {
    const store = useChangelogStore.getState();

    act(() => {
      store.openViewer();
    });

    expect(store.isViewerOpen).toBe(true);

    act(() => {
      store.closeViewer();
    });

    expect(store.isViewerOpen).toBe(false);
  });

  it('should filter releases by search query', () => {
    const store = useChangelogStore.getState();

    const allReleases = store.getFilteredReleases();
    expect(allReleases.length).toBeGreaterThan(0);

    act(() => {
      store.setFilter({ searchQuery: 'tutorial' });
    });

    const filteredReleases = store.getFilteredReleases();
    const hasMatchingContent = filteredReleases.every(release =>
      release.version.toLowerCase().includes('tutorial') ||
      release.categories.some(
        cat =>
          cat.name.toLowerCase().includes('tutorial') ||
          cat.changes.some(
            change =>
              change.title.toLowerCase().includes('tutorial') ||
              change.description.toLowerCase().includes('tutorial')
          )
      )
    );
    expect(hasMatchingContent).toBe(true);
  });

  it('should filter releases by tags', () => {
    const store = useChangelogStore.getState();

    act(() => {
      store.setFilter({ selectedTags: ['tutorials'] });
    });

    const filteredReleases = store.getFilteredReleases();
    if (filteredReleases.length > 0) {
      const hasMatchingTag = filteredReleases.every(release =>
        release.categories.some(cat =>
          cat.changes.some(change => change.tags.includes('tutorials'))
        )
      );
      expect(hasMatchingTag).toBe(true);
    }
  });

  it('should get all available tags', () => {
    const store = useChangelogStore.getState();

    const tags = store.getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(tags).toContain('tutorials');
    expect(tags).toContain('help');
  });

  it('should clear filters', () => {
    const store = useChangelogStore.getState();

    act(() => {
      store.setFilter({ searchQuery: 'test', selectedTags: ['tutorials'] });
    });

    expect(store.filter.searchQuery).toBe('test');
    expect(store.filter.selectedTags).toContain('tutorials');

    act(() => {
      store.clearFilters();
    });

    expect(store.filter.searchQuery).toBe('');
    expect(store.filter.selectedTags.length).toBe(0);
  });

  it('should mark version as seen', () => {
    const store = useChangelogStore.getState();
    const version = '1.3.0';

    expect(store.lastSeenVersion).not.toBe(version);

    act(() => {
      store.markVersionSeen(version);
    });

    expect(store.lastSeenVersion).toBe(version);
  });

  it('should detect unseen changes', () => {
    const store = useChangelogStore.getState();
    const currentVersion = '1.0.0';

    const hasUnseen = store.hasUnseenChanges(currentVersion);
    expect(typeof hasUnseen).toBe('boolean');
  });

  it('should get unseen releases', () => {
    const store = useChangelogStore.getState();
    const currentVersion = '1.0.0';

    const unseenReleases = store.getUnseenReleases(currentVersion);
    expect(Array.isArray(unseenReleases)).toBe(true);
  });

  it('should open and close whats new modal', () => {
    const store = useChangelogStore.getState();

    act(() => {
      store.openWhatsNew();
    });

    expect(store.isWhatsNewOpen).toBe(true);

    act(() => {
      store.closeWhatsNew();
    });

    expect(store.isWhatsNewOpen).toBe(false);
  });

  it('should mark latest version as seen when closing whats new', () => {
    const store = useChangelogStore.getState();
    const latestVersion = store.data.releases[0]?.version;

    act(() => {
      store.openWhatsNew();
      store.closeWhatsNew();
    });

    expect(store.lastSeenVersion).toBe(latestVersion);
  });
});
