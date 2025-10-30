import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Download,
  Upload,
  Save,
  Copy,
  Check,
  X,
  Eye,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { themePresets } from '../../constants/themePresets';
import { ThemeColors, ThemeEffects } from '../../types/theme';

const defaultEffects: ThemeEffects = {
  glowStrength: 'subtle',
  ambience: 'balanced',
  glassmorphism: true,
};

export function ThemeEditor() {
  const {
    currentTheme,
    customThemes,
    setTheme,
    setThemeFromPreset,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    exportTheme,
    importTheme,
  } = useThemeStore();

  const [isCreating, setIsCreating] = useState(false);
  const [customName, setCustomName] = useState('');
  const [editingColors, setEditingColors] = useState<ThemeColors>(currentTheme.colors);
  const [editingEffects, setEditingEffects] = useState<ThemeEffects>(currentTheme.effects ?? defaultEffects);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    setEditingColors(currentTheme.colors);
    setEditingEffects(currentTheme.effects ?? defaultEffects);
  }, [currentTheme]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setEditingColors(prev => ({ ...prev, [key]: value }));
  };

  const handleEffectsChange = <K extends keyof ThemeEffects>(key: K, value: ThemeEffects[K]) => {
    setEditingEffects(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveCustomTheme = () => {
    if (!customName.trim()) {
      alert('Please enter a theme name');
      return;
    }

    if (currentTheme.isCustom) {
      updateCustomTheme(currentTheme.id, {
        name: customName,
        colors: editingColors,
        effects: editingEffects,
      });
    } else {
      createCustomTheme(customName, editingColors, editingEffects);
    }

    setIsCreating(false);
    setCustomName('');
  };

  const handleExportTheme = () => {
    const json = exportTheme(currentTheme.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        importTheme(text);
        setImportError(null);
      } catch (error) {
        setImportError('Failed to import theme. Please check the file format.');
        setTimeout(() => setImportError(null), 3000);
      }
    };
    input.click();
  };

  const handleCopyToClipboard = () => {
    const json = exportTheme(currentTheme.id);
    navigator.clipboard.writeText(json);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const startCreating = () => {
    setIsCreating(true);
    setCustomName(currentTheme.name);
    setEditingColors(currentTheme.colors);
    setEditingEffects(currentTheme.effects ?? defaultEffects);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setCustomName('');
    setEditingColors(currentTheme.colors);
    setEditingEffects(currentTheme.effects ?? defaultEffects);
  };

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span>Theme Presets</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themePresets.map(preset => (
            <motion.button
              key={preset.id}
              onClick={() => setThemeFromPreset(preset.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                currentTheme.id === `theme-${preset.id}`
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
              }`}
              aria-label={`Apply ${preset.name} theme`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{preset.name}</h4>
                {currentTheme.id === `theme-${preset.id}` && (
                  <Check className="w-5 h-5 text-purple-400" aria-label="Currently active" />
                )}
              </div>
              <p className="text-sm text-white/60 mb-3">{preset.description}</p>
              <div className="flex gap-1 h-6">
                {Object.entries(preset.colors)
                  .slice(0, 8)
                  .map(([key, color]) => (
                    <div
                      key={key}
                      className="flex-1 rounded"
                      style={{ backgroundColor: color }}
                      aria-label={`${key} color: ${color}`}
                    />
                  ))}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Themes */}
      {customThemes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" aria-hidden="true" />
            <span>Custom Themes</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customThemes.map(theme => (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  currentTheme.id === theme.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-purple-500/20 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{theme.name}</h4>
                  <div className="flex gap-2">
                    {currentTheme.id === theme.id && (
                      <Check className="w-5 h-5 text-purple-400" aria-label="Currently active" />
                    )}
                    <button
                      onClick={() => deleteCustomTheme(theme.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Delete ${theme.name} theme`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 h-6 mb-3">
                  {Object.entries(theme.colors)
                    .slice(0, 8)
                    .map(([key, color]) => (
                      <div
                        key={key}
                        className="flex-1 rounded"
                        style={{ backgroundColor: color }}
                        aria-label={`${key} color: ${color}`}
                      />
                    ))}
                </div>
                <button
                  onClick={() => {
                    setTheme(theme.id);
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  aria-label={`Apply ${theme.name} theme`}
                >
                  <Eye className="w-4 h-4" />
                  Apply
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          onClick={startCreating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30"
          aria-label="Create custom theme"
        >
          <Palette className="w-5 h-5" />
          Create Custom Theme
        </motion.button>

        <motion.button
          onClick={handleExportTheme}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold flex items-center gap-2"
          aria-label="Export current theme"
        >
          {exportSuccess ? (
            <>
              <Check className="w-5 h-5" />
              Exported!
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Theme
            </>
          )}
        </motion.button>

        <motion.button
          onClick={handleCopyToClipboard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold flex items-center gap-2"
          aria-label="Copy theme to clipboard"
        >
          <Copy className="w-5 h-5" />
          Copy to Clipboard
        </motion.button>

        <motion.button
          onClick={handleImportTheme}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold flex items-center gap-2"
          aria-label="Import theme from file"
        >
          <Upload className="w-5 h-5" />
          Import Theme
        </motion.button>
      </div>

      {importError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
          role="alert"
        >
          {importError}
        </motion.div>
      )}

      {/* Color Editor Modal */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={cancelCreating}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-purple-500/20 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="theme-editor-title"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 id="theme-editor-title" className="text-2xl font-bold flex items-center gap-2">
                <Palette className="w-6 h-6" aria-hidden="true" />
                Customize Theme
              </h3>
              <button
                onClick={cancelCreating}
                className="text-white/60 hover:text-white"
                aria-label="Close theme editor"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label htmlFor="theme-name" className="block text-sm font-medium mb-2">
                Theme Name
              </label>
              <input
                id="theme-name"
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="My Custom Theme"
                className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                aria-required="true"
              />
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Colors</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(editingColors) as Array<keyof ThemeColors>).map(key => (
                  <div key={key}>
                    <label htmlFor={`color-${key}`} className="block text-sm font-medium mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`color-${key}`}
                        type="color"
                        value={editingColors[key]}
                        onChange={e => handleColorChange(key, e.target.value)}
                        className="w-16 h-10 rounded-lg border border-[rgba(255,140,66,0.35)] cursor-pointer bg-transparent"
                        aria-label={`Choose ${key} color`}
                      />
                      <input
                        type="text"
                        value={editingColors[key]}
                        onChange={e => handleColorChange(key, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[rgba(192,204,218,0.25)] bg-[rgba(18,24,38,0.65)] text-moonlight-silver text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(255,140,66,0.35)]"
                        aria-label={`${key} color value`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-4">Effects</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="glow-strength" className="block text-sm font-medium mb-2">
                    Glow Strength
                  </label>
                  <select
                    id="glow-strength"
                    value={editingEffects.glowStrength}
                    onChange={e => handleEffectsChange('glowStrength', e.target.value as ThemeEffects['glowStrength'])}
                    className="w-full px-3 py-2 rounded-lg border border-[rgba(192,204,218,0.25)] bg-[rgba(18,24,38,0.65)] text-moonlight-silver focus:outline-none focus:ring-2 focus:ring-[rgba(255,140,66,0.35)]"
                  >
                    <option value="none">None</option>
                    <option value="subtle">Subtle</option>
                    <option value="normal">Normal</option>
                    <option value="strong">Strong</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ambience" className="block text-sm font-medium mb-2">
                    Ambience
                  </label>
                  <select
                    id="ambience"
                    value={editingEffects.ambience}
                    onChange={e => handleEffectsChange('ambience', e.target.value as ThemeEffects['ambience'])}
                    className="w-full px-3 py-2 rounded-lg border border-[rgba(192,204,218,0.25)] bg-[rgba(18,24,38,0.65)] text-moonlight-silver focus:outline-none focus:ring-2 focus:ring-[rgba(255,140,66,0.35)]"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="balanced">Balanced</option>
                    <option value="immersive">Immersive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="glassmorphism" className="block text-sm font-medium mb-2">
                    Glassmorphism
                  </label>
                  <select
                    id="glassmorphism"
                    value={editingEffects.glassmorphism ? 'enabled' : 'disabled'}
                    onChange={e => handleEffectsChange('glassmorphism', e.target.value === 'enabled')}
                    className="w-full px-3 py-2 rounded-lg border border-[rgba(192,204,218,0.25)] bg-[rgba(18,24,38,0.65)] text-moonlight-silver focus:outline-none focus:ring-2 focus:ring-[rgba(255,140,66,0.35)]"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <motion.button
                onClick={cancelCreating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSaveCustomTheme}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30"
                aria-label="Save custom theme"
              >
                <Save className="w-5 h-5" />
                Save Theme
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
