import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tutorial, TutorialProgress } from '../types/tutorials';
import tutorialsData from '../data/tutorials.json';

interface TutorialState {
  tutorials: Tutorial[];
  progress: Record<string, TutorialProgress>;
  activeTutorialId: string | null;
  currentStep: number;
  isPlaying: boolean;
  autoStart: boolean;
  
  startTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  resetTutorial: (tutorialId: string) => void;
  completeTutorial: () => void;
  stopTutorial: () => void;
  setAutoStart: (enabled: boolean) => void;
  getTutorialProgress: (tutorialId: string) => TutorialProgress | null;
  getAvailableTutorials: (currentPage?: string) => Tutorial[];
  resetAllProgress: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      tutorials: tutorialsData.tutorials as Tutorial[],
      progress: {},
      activeTutorialId: null,
      currentStep: 0,
      isPlaying: false,
      autoStart: true,
      
      startTutorial: (tutorialId: string) => {
        const tutorial = get().tutorials.find(t => t.id === tutorialId);
        if (!tutorial) return;
        
        const timestamp = new Date().toISOString();
        set(state => ({
          activeTutorialId: tutorialId,
          currentStep: 0,
          isPlaying: true,
          progress: {
            ...state.progress,
            [tutorialId]: {
              tutorialId,
              currentStep: 0,
              completed: false,
              skipped: false,
              lastUpdated: timestamp,
            },
          },
        }));
      },
      
      nextStep: () => {
        const { activeTutorialId, currentStep, tutorials } = get();
        if (!activeTutorialId) return;
        
        const tutorial = tutorials.find(t => t.id === activeTutorialId);
        if (!tutorial) return;
        
        if (currentStep < tutorial.steps.length - 1) {
          const nextStepIndex = currentStep + 1;
          const timestamp = new Date().toISOString();
          set(state => ({
            currentStep: nextStepIndex,
            progress: {
              ...state.progress,
              [activeTutorialId]: {
                tutorialId: activeTutorialId,
                currentStep: nextStepIndex,
                completed: false,
                skipped: false,
                lastUpdated: timestamp,
              },
            },
          }));
        } else {
          get().completeTutorial();
        }
      },
      
      previousStep: () => {
        const { activeTutorialId, currentStep } = get();
        if (currentStep > 0 && activeTutorialId) {
          const previousStepIndex = currentStep - 1;
          const timestamp = new Date().toISOString();
          set(state => ({
            currentStep: previousStepIndex,
            progress: {
              ...state.progress,
              [activeTutorialId]: {
                tutorialId: activeTutorialId,
                currentStep: previousStepIndex,
                completed: false,
                skipped: false,
                lastUpdated: timestamp,
              },
            },
          }));
        }
      },
      
      skipTutorial: () => {
        const { activeTutorialId } = get();
        if (!activeTutorialId) return;
        
        set(state => ({
          progress: {
            ...state.progress,
            [activeTutorialId]: {
              tutorialId: activeTutorialId,
              currentStep: state.currentStep,
              completed: false,
              skipped: true,
              lastUpdated: new Date().toISOString(),
            },
          },
          activeTutorialId: null,
          currentStep: 0,
          isPlaying: false,
        }));
      },
      
      resetTutorial: (tutorialId: string) => {
        set(state => {
          const newProgress = { ...state.progress };
          delete newProgress[tutorialId];
          return { progress: newProgress };
        });
      },
      
      completeTutorial: () => {
        const { activeTutorialId, currentStep } = get();
        if (!activeTutorialId) return;
        
        set(state => ({
          progress: {
            ...state.progress,
            [activeTutorialId]: {
              tutorialId: activeTutorialId,
              currentStep: currentStep,
              completed: true,
              skipped: false,
              lastUpdated: new Date().toISOString(),
            },
          },
          activeTutorialId: null,
          currentStep: 0,
          isPlaying: false,
        }));
      },
      
      stopTutorial: () => {
        set({
          activeTutorialId: null,
          currentStep: 0,
          isPlaying: false,
        });
      },
      
      setAutoStart: (enabled: boolean) => {
        set({ autoStart: enabled });
      },
      
      getTutorialProgress: (tutorialId: string) => {
        return get().progress[tutorialId] || null;
      },
      
      getAvailableTutorials: (currentPage?: string) => {
        const { tutorials, progress } = get();
        return tutorials.filter(tutorial => {
          // Filter by required page if specified
          if (currentPage && tutorial.requiredPages.length > 0) {
            if (!tutorial.requiredPages.includes(currentPage)) {
              return false;
            }
          }
          // Don't show completed tutorials unless reset
          const tutorialProgress = progress[tutorial.id];
          if (tutorialProgress?.completed) {
            return false;
          }
          return true;
        });
      },
      
      resetAllProgress: () => {
        set({ progress: {} });
      },
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({
        progress: state.progress,
        autoStart: state.autoStart,
      }),
    }
  )
);
