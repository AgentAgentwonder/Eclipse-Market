export type DrawingTool =
  | 'trendline'
  | 'horizontal'
  | 'vertical'
  | 'fibonacci'
  | 'channel'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'path'
  | 'text'
  | 'brush'
  | 'arrow'
  | 'pitchfork'
  | 'gannFan'
  | 'fibTimeZone';

export interface DrawingStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  background?: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
  timestamp?: number;
  price?: number;
}

export interface DrawingTemplate {
  id: string;
  name: string;
  description?: string;
  tool: DrawingTool;
  style: DrawingStyle;
  defaultPoints: DrawingPoint[];
  metadata?: Record<string, unknown>;
}

export interface DrawingObject {
  id: string;
  userId: string;
  symbol: string;
  tool: DrawingTool;
  points: DrawingPoint[];
  style: DrawingStyle;
  locked: boolean;
  hidden: boolean;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  sharedWith?: string[];
  metadata?: Record<string, unknown>;
}

export interface DrawingStatePersistence {
  drawings: DrawingObject[];
  templates: DrawingTemplate[];
  lastSyncedAt: string | null;
  syncedDevices: string[];
}

export const DEFAULT_DRAWING_STYLE: DrawingStyle = {
  strokeColor: '#a855f7',
  strokeWidth: 2,
  fillColor: 'rgba(168,85,247,0.1)',
  opacity: 1,
  lineStyle: 'solid',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  bold: false,
  italic: false,
  background: false,
};
