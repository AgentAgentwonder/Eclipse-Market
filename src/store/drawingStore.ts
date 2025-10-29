import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import type { DrawingObject, DrawingTemplate, DrawingTool, DrawingStyle } from '../types/drawings';
import { DEFAULT_DRAWING_STYLE } from '../types/drawings';

interface DrawingState {
  drawings: DrawingObject[];
  templates: DrawingTemplate[];
  activeTool: DrawingTool | null;
  activeStyle: DrawingStyle;
  selectedDrawingId: string | null;
  isLoading: boolean;
  error: string | null;

  setActiveTool: (tool: DrawingTool | null) => void;
  setActiveStyle: (style: Partial<DrawingStyle>) => void;
  addDrawing: (drawing: Omit<DrawingObject, 'id' | 'createdAt' | 'updatedAt'>) => DrawingObject;
  updateDrawing: (id: string, updates: Partial<DrawingObject>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  duplicateDrawing: (id: string) => DrawingObject | null;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;
  selectDrawing: (id: string | null) => void;

  addTemplate: (template: Omit<DrawingTemplate, 'id'>) => DrawingTemplate;
  updateTemplate: (id: string, updates: Partial<DrawingTemplate>) => void;
  removeTemplate: (id: string) => void;
  loadTemplates: () => Promise<void>;

  loadDrawings: (symbol: string) => Promise<void>;
  saveDrawings: (symbol: string) => Promise<void>;
  syncDrawings: (symbol: string) => Promise<void>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  drawings: [],
  templates: [],
  activeTool: null,
  activeStyle: { ...DEFAULT_DRAWING_STYLE },
  selectedDrawingId: null,
  isLoading: false,
  error: null,

  setActiveTool: tool => set({ activeTool: tool }),

  setActiveStyle: style =>
    set(state => ({
      activeStyle: { ...state.activeStyle, ...style },
    })),

  addDrawing: drawing => {
    const newDrawing: DrawingObject = {
      ...drawing,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locked: drawing.locked ?? false,
      hidden: drawing.hidden ?? false,
      style: drawing.style ?? { ...DEFAULT_DRAWING_STYLE, ...get().activeStyle },
    };

    set(state => ({ drawings: [...state.drawings, newDrawing] }));
    return newDrawing;
  },

  updateDrawing: (id, updates) => {
    set(state => ({
      drawings: state.drawings.map(drawing =>
        drawing.id === id
          ? { ...drawing, ...updates, updatedAt: new Date().toISOString() }
          : drawing
      ),
    }));
  },

  removeDrawing: id => {
    set(state => ({
      drawings: state.drawings.filter(drawing => drawing.id !== id),
      selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
    }));
  },

  clearDrawings: () => set({ drawings: [], selectedDrawingId: null }),

  duplicateDrawing: id => {
    const state = get();
    const drawing = state.drawings.find(d => d.id === id);
    if (!drawing) return null;

    const duplicate: DrawingObject = {
      ...drawing,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      points: drawing.points.map(point => ({ ...point, x: point.x + 10, y: point.y + 10 })),
    };

    set(state => ({ drawings: [...state.drawings, duplicate] }));
    return duplicate;
  },

  bringToFront: id => {
    set(state => {
      const drawing = state.drawings.find(d => d.id === id);
      if (!drawing) return state;
      return {
        ...state,
        drawings: [...state.drawings.filter(d => d.id !== id), drawing],
      };
    });
  },

  sendToBack: id => {
    set(state => {
      const drawing = state.drawings.find(d => d.id === id);
      if (!drawing) return state;
      return {
        ...state,
        drawings: [drawing, ...state.drawings.filter(d => d.id !== id)],
      };
    });
  },

  toggleLock: id => {
    set(state => ({
      drawings: state.drawings.map(d =>
        d.id === id ? { ...d, locked: !d.locked } : d
      ),
    }));
  },

  toggleVisibility: id => {
    set(state => ({
      drawings: state.drawings.map(d =>
        d.id === id ? { ...d, hidden: !d.hidden } : d
      ),
    }));
  },

  selectDrawing: id => set({ selectedDrawingId: id }),

  addTemplate: template => {
    const newTemplate: DrawingTemplate = {
      ...template,
      id: generateId(),
    };

    set(state => ({ templates: [...state.templates, newTemplate] }));
    return newTemplate;
  },

  updateTemplate: (id, updates) => {
    set(state => ({
      templates: state.templates.map(template =>
        template.id === id ? { ...template, ...updates } : template
      ),
    }));
  },

  removeTemplate: id => {
    set(state => ({ templates: state.templates.filter(template => template.id !== id) }));
  },

  loadTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await invoke<DrawingTemplate[]>('drawing_list_templates');
      set({ templates: response, isLoading: false });
    } catch (error) {
      console.error('Failed to load drawing templates', error);
      set({ error: String(error), isLoading: false });
    }
  },

  loadDrawings: async symbol => {
    set({ isLoading: true, error: null });
    try {
      const drawings = await invoke<DrawingObject[]>('drawing_list', { symbol });
      set({ drawings, isLoading: false });
    } catch (error) {
      console.error('Failed to load drawings', error);
      set({ error: String(error), isLoading: false });
    }
  },

  saveDrawings: async symbol => {
    const { drawings } = get();
    try {
      await invoke('drawing_save', { symbol, drawings });
    } catch (error) {
      console.error('Failed to save drawings', error);
    }
  },

  syncDrawings: async symbol => {
    set({ isLoading: true, error: null });
    try {
      const synced = await invoke<DrawingObject[]>('drawing_sync', { symbol });
      set({ drawings: synced, isLoading: false });
    } catch (error) {
      console.error('Failed to sync drawings', error);
      set({ error: String(error), isLoading: false });
    }
  },
}));
