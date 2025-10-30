import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import changelogData from '../data/changelog.json';
import { ChangelogData, ChangelogRelease, ChangelogFilter } from '../types/changelog';

interface ChangelogState {
  data: ChangelogData;
  filter: ChangelogFilter;
  isViewerOpen: boolean;
  isWhatsNewOpen: boolean;
  lastSeenVersion: string | null;
  selectedRelease: string | null;

  openViewer: () => void;
  closeViewer: () => void;
  openWhatsNew: () => void;
  closeWhatsNew: () => void;
  setFilter: (filter: Partial<ChangelogFilter>) => void;
  clearFilters: () => void;
  markVersionSeen: (version: string) => void;
  setSelectedRelease: (version: string | null) => void;
  getFilteredReleases: () => ChangelogRelease[];
  getAllTags: () => string[];
  hasUnseenChanges: (currentVersion: string) => boolean;
  getUnseenReleases: (currentVersion: string) => ChangelogRelease[];
}

export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set, get) => ({
      data: changelogData as ChangelogData,
      filter: {
        searchQuery: '',
        selectedTags: [],
        categoryFilter: [],
      },
      isViewerOpen: false,
      isWhatsNewOpen: false,
      lastSeenVersion: null,
      selectedRelease: null,

      openViewer: () => {
        set({ isViewerOpen: true });
      },

      closeViewer: () => {
        set({ isViewerOpen: false, selectedRelease: null });
      },

      openWhatsNew: () => {
        set({ isWhatsNewOpen: true });
      },

      closeWhatsNew: () => {
        const latestVersion = get().data.releases[0]?.version;
        if (latestVersion) {
          get().markVersionSeen(latestVersion);
        }
        set({ isWhatsNewOpen: false });
      },

      setFilter: (filter: Partial<ChangelogFilter>) => {
        set(state => ({
          filter: { ...state.filter, ...filter },
        }));
      },

      clearFilters: () => {
        set({
          filter: {
            searchQuery: '',
            selectedTags: [],
            categoryFilter: [],
          },
        });
      },

      markVersionSeen: (version: string) => {
        set({ lastSeenVersion: version });
      },

      setSelectedRelease: (version: string | null) => {
        set({ selectedRelease: version });
      },

      getFilteredReleases: () => {
        const { data, filter } = get();
        const { searchQuery, selectedTags, categoryFilter } = filter;

        return data.releases.filter(release => {
          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesVersion = release.version.toLowerCase().includes(query);
            const matchesCategories = release.categories.some(cat =>
              cat.name.toLowerCase().includes(query) ||
              cat.changes.some(
                change =>
                  change.title.toLowerCase().includes(query) ||
                  change.description.toLowerCase().includes(query)
              )
            );
            if (!matchesVersion && !matchesCategories) {
              return false;
            }
          }

          // Filter by tags
          if (selectedTags.length > 0) {
            const hasMatchingTag = release.categories.some(cat =>
              cat.changes.some(change =>
                change.tags.some(tag => selectedTags.includes(tag))
              )
            );
            if (!hasMatchingTag) {
              return false;
            }
          }

          // Filter by category
          if (categoryFilter.length > 0) {
            const hasMatchingCategory = release.categories.some(cat =>
              categoryFilter.includes(cat.name)
            );
            if (!hasMatchingCategory) {
              return false;
            }
          }

          return true;
        });
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().data.releases.forEach(release => {
          release.categories.forEach(category => {
            category.changes.forEach(change => {
              change.tags.forEach(tag => tags.add(tag));
            });
          });
        });
        return Array.from(tags).sort();
      },

      hasUnseenChanges: (currentVersion: string) => {
        const { lastSeenVersion, data } = get();
        if (!lastSeenVersion) {
          return data.releases.length > 0 && data.releases[0].version !== currentVersion;
        }
        const latestVersion = data.releases[0]?.version;
        return latestVersion && latestVersion !== lastSeenVersion;
      },

      getUnseenReleases: (currentVersion: string) => {
        const { lastSeenVersion, data } = get();
        const targetVersion = lastSeenVersion || currentVersion;
        const unseenReleases: ChangelogRelease[] = [];

        for (const release of data.releases) {
          if (release.version === targetVersion) {
            break;
          }
          unseenReleases.push(release);
        }

        return unseenReleases;
      },
    }),
    {
      name: 'changelog-storage',
      partialize: (state) => ({
        lastSeenVersion: state.lastSeenVersion,
      }),
    }
  )
);
