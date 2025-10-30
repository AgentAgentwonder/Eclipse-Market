export interface ChangelogChange {
  title: string;
  description: string;
  tags: string[];
}

export interface ChangelogCategory {
  name: string;
  changes: ChangelogChange[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  categories: ChangelogCategory[];
}

export interface ChangelogData {
  releases: ChangelogRelease[];
}

export interface ChangelogFilter {
  searchQuery: string;
  selectedTags: string[];
  categoryFilter: string[];
}
