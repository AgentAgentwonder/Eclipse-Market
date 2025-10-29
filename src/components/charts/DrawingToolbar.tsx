import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  MousePointer,
  Minus,
  Line,
  Square,
  Circle,
  Type,
  ArrowDownLeft,
  Ruler,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Upload,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Shapes,
  Palette,
  Download,
} from 'lucide-react';
import { useDrawingStore } from '../../store/drawingStore';
import type { DrawingTool } from '../../types/drawings';

interface DrawingToolbarProps {
  onTemplateLoad?: () => void;
  onTemplateSave?: () => void;
  onClear?: () => void;
}

const TOOL_OPTIONS: { tool: DrawingTool; label: string; icon: React.ReactNode }[] = [
  { tool: 'trendline', label: 'Trendline', icon: <Line className="w-4 h-4" /> },
  { tool: 'horizontal', label: 'Horizontal', icon: <Minus className="w-4 h-4" /> },
  { tool: 'vertical', label: 'Vertical', icon: <Line className="w-4 h-4 rotate-90" /> },
  { tool: 'fibonacci', label: 'Fibonacci', icon: <Ruler className="w-4 h-4" /> },
  { tool: 'channel', label: 'Channel', icon: <PenTool className="w-4 h-4" /> },
  { tool: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
  { tool: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" /> },
  { tool: 'triangle', label: 'Triangle', icon: <Shapes className="w-4 h-4" /> },
  { tool: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { tool: 'path', label: 'Path', icon: <PenTool className="w-4 h-4" /> },
  { tool: 'arrow', label: 'Arrow', icon: <ArrowDownLeft className="w-4 h-4" /> },
  { tool: 'pitchfork', label: 'Pitchfork', icon: <Ruler className="w-4 h-4" /> },
  { tool: 'gannFan', label: 'Gann Fan', icon: <Ruler className="w-4 h-4" /> },
  { tool: 'fibTimeZone', label: 'Fibonacci Time', icon: <Ruler className="w-4 h-4" /> },
  { tool: 'brush', label: 'Brush', icon: <PenTool className="w-4 h-4" /> },
];

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ onTemplateLoad, onTemplateSave, onClear }) => {
  const {
    activeTool,
    setActiveTool,
    activeStyle,
    setActiveStyle,
    selectedDrawingId,
    toggleVisibility,
    toggleLock,
    bringToFront,
    sendToBack,
    removeDrawing,
  } = useDrawingStore();

  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-purple-500/20 shadow-lg"
    >
      <button
        onClick={() => setActiveTool(null)}
        className={`p-2 rounded-xl transition-colors ${
          activeTool === null ? 'bg-purple-500/40 text-white' : 'hover:bg-purple-500/20'
        }`}
        title="Select"
      >
        <MousePointer className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 border-x border-slate-700 px-2">
        {TOOL_OPTIONS.map(option => (
          <button
            key={option.tool}
            onClick={() => setActiveTool(activeTool === option.tool ? null : option.tool)}
            className={`p-2 rounded-xl transition-colors ${
              activeTool === option.tool ? 'bg-purple-500/40 text-white' : 'hover:bg-purple-500/20'
            }`}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowStyleEditor(!showStyleEditor)}
          className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
          title="Style"
        >
          <Palette className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
          title="Templates"
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={() => onTemplateLoad?.()}
          className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
          title="Load Template"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={() => onTemplateSave?.()}
          className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
          title="Save Template"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => onClear?.()}
          className="p-2 rounded-xl hover:bg-red-500/20 transition-colors text-red-400"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {selectedDrawingId && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 border-l border-slate-700 pl-2 ml-2"
          >
            <button
              onClick={() => toggleVisibility(selectedDrawingId)}
              className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
              title="Toggle visibility"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => toggleLock(selectedDrawingId)}
              className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
              title="Lock/Unlock"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              onClick={() => bringToFront(selectedDrawingId)}
              className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
              title="Bring to Front"
            >
              <BringToFront className="w-4 h-4" />
            </button>

            <button
              onClick={() => sendToBack(selectedDrawingId)}
              className="p-2 rounded-xl hover:bg-purple-500/20 transition-colors"
              title="Send to Back"
            >
              <SendToBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => removeDrawing(selectedDrawingId)}
              className="p-2 rounded-xl hover:bg-red-500/20 transition-colors text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStyleEditor && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 left-0 right-0 mx-auto w-[320px] bg-slate-900/95 border border-purple-500/20 rounded-2xl shadow-xl p-4"
          >
            <h3 className="text-sm font-semibold mb-3">Drawing Style</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Stroke Color</label>
                <input
                  type="color"
                  value={activeStyle.strokeColor}
                  onChange={e => setActiveStyle({ strokeColor: e.target.value })}
                  className="w-full h-10 rounded"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Fill Color</label>
                <input
                  type="color"
                  value={activeStyle.fillColor}
                  onChange={e => setActiveStyle({ fillColor: e.target.value })}
                  className="w-full h-10 rounded"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Line Width</label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={activeStyle.strokeWidth}
                  onChange={e => setActiveStyle({ strokeWidth: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 flex-1">Opacity</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={activeStyle.opacity}
                  onChange={e => setActiveStyle({ opacity: Number(e.target.value) })}
                  className="flex-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DrawingToolbar;
