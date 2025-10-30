export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  points?: string[];
  target?: string;
  highlightOffset?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  icon?: string;
  action: {
    type: 'continue' | 'finish';
  };
  videoUrl?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredPages: string[];
  steps: TutorialStep[];
}

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  skipped: boolean;
  lastUpdated: string;
}

export interface TutorialState {
  tutorials: Tutorial[];
  progress: Record<string, TutorialProgress>;
  activeTutorialId: string | null;
  currentStep: number;
  isPlaying: boolean;
  autoStart: boolean;
}
