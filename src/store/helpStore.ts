import { create } from 'zustand';
import helpContent from '../data/helpContent.json';
import { HelpContent, HelpItem, HelpSection } from '../types/help';

interface HelpState {
  content: HelpContent;
  isPanelOpen: boolean;
  activeSectionId: string | null;
  activeItemId: string | null;
  whatsThisMode: boolean;
  highlightedElement: HTMLElement | null;
  searchQuery: string;

  openPanel: (sectionId?: string, itemId?: string) => void;
  closePanel: () => void;
  setSearchQuery: (query: string) => void;
  enterWhatsThisMode: () => void;
  exitWhatsThisMode: () => void;
  setHighlightedElement: (element: HTMLElement | null) => void;
  getSectionById: (id: string) => HelpSection | undefined;
  getItemById: (id: string) => HelpItem | undefined;
}

export const useHelpStore = create<HelpState>()((set, get) => ({
  content: helpContent as HelpContent,
  isPanelOpen: false,
  activeSectionId: null,
  activeItemId: null,
  whatsThisMode: false,
  highlightedElement: null,
  searchQuery: '',

  openPanel: (sectionId?: string, itemId?: string) => {
    set({
      isPanelOpen: true,
      activeSectionId: sectionId ?? null,
      activeItemId: itemId ?? null,
    });
  },

  closePanel: () => {
    const { highlightedElement } = get();
    if (highlightedElement) {
      highlightedElement.removeAttribute('data-help-active');
    }
    set({
      isPanelOpen: false,
      activeSectionId: null,
      activeItemId: null,
      searchQuery: '',
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  enterWhatsThisMode: () => {
    set({ whatsThisMode: true });
    document.body.setAttribute('data-whats-this', 'true');
  },

  exitWhatsThisMode: () => {
    const { highlightedElement } = get();
    if (highlightedElement) {
      highlightedElement.removeAttribute('data-help-active');
    }
    document.body.removeAttribute('data-whats-this');
    set({ whatsThisMode: false, highlightedElement: null });
  },

  setHighlightedElement: (element: HTMLElement | null) => {
    const { highlightedElement } = get();
    if (highlightedElement) {
      highlightedElement.removeAttribute('data-help-active');
      highlightedElement.removeAttribute('aria-describedby');
    }
    if (element) {
      element.setAttribute('data-help-active', 'true');
    }
    set({ highlightedElement: element });
  },

  getSectionById: (id: string) => {
    return (get().content.sections || []).find(section => section.id === id);
  },

  getItemById: (id: string) => {
    for (const section of get().content.sections || []) {
      const item = section.items.find(item => item.id === id);
      if (item) {
        return item;
      }
    }
    return undefined;
  },
}));
