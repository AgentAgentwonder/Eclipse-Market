export interface HelpLink {
  type: 'docs' | 'video' | 'tutorial';
  label: string;
  url: string;
}

export interface HelpItem {
  id: string;
  label: string;
  selectors: string[];
  description: string;
  links: HelpLink[];
}

export interface HelpSection {
  id: string;
  title: string;
  summary: string;
  items: HelpItem[];
}

export interface HelpContent {
  sections: HelpSection[];
  whatsThis: {
    hint: string;
    empty: string;
    keyboard: string;
  };
}
