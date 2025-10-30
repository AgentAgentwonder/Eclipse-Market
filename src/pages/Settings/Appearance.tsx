import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Monitor,
  Sun,
  Moon,
  Eye,
  Check,
  Sparkles,
  Settings,
  Zap,
  Clock,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { themePresets } from '../../constants/themePresets';
import { ThemeEditor } from '../../components/theme/ThemeEditor';

export function Appearance() {
  const { currentTheme, setTheme, setThemeFromPreset, applyThemeColors } = useThemeStore();
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  useEffect(() => {
    applyThemeColors();
  }, [applyThemeColors]);

  const handleThemeSelect = (themeId: string) => {
    setThemeFromPreset(themeId);
    setPreviewTheme(null);
  };

  const handlePreview = (themeId: string) => {
    setPreviewTheme(themeId);
    setThemeFromPreset(themeId);
  };

  const cancelPreview = () => {
    if (previewTheme && currentTheme.id !== `theme-${previewTheme}`) {
      setTheme(currentTheme.id);
    }
    setPreviewTheme(null);
  };

  const isDark = (themeId: string) => {
    return !['light-professional'].includes(themeId);
  };

  const categorizeThemes = () => {
    const dark = themePresets.filter(t => isDark(t.id));
    const light = themePresets.filter(t => !isDark(t.id));
    return { dark, light };
  };

  const { dark, light } = categorizeThemes();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Palette className="w-10 h-10 text-purple-400" />
            Appearance
          </h1>
          <p className="text-white/60">
            Customize the look and feel of Eclipse-Market with professional themes and color customization.
          </p>
        </div>

        {/* Free Tier Message */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Eclipse-Market is 100% Free</h3>
              <p className="text-white/80 leading-relaxed">
                All themes, customization options, and appearance features are completely free. No subscriptions,
                no premium tiers, no limitations. Create unlimited custom themes and switch between them instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Dark Themes */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Moon className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Dark Themes</h2>
            <span className="text-sm text-white/60">({dark.length} themes)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dark.map(preset => {
              const isActive = currentTheme.id === `theme-${preset.id}`;
              const isPreviewing = previewTheme === preset.id;

              return (
                <motion.div
                  key={preset.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`group relative rounded-2xl border-2 transition-all overflow-hidden ${
                    isActive
                      ? 'border-purple-500 bg-purple-500/10 shadow-xl shadow-purple-500/20'
                      : isPreviewing
                        ? 'border-pink-500 bg-pink-500/10'
                        : 'border-purple-500/20 bg-slate-800/30 hover:border-purple-500/40'
                  }`}
                >
                  {/* Theme Preview Colors */}
                  <div className="h-32 p-4" style={{ background: preset.colors.background }}>
                    <div
                      className="h-full rounded-xl p-3 backdrop-blur-sm"
                      style={{
                        background: preset.colors.backgroundSecondary,
                        border: `1px solid ${preset.colors.border}`,
                      }}
                    >
                      <div className="flex gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: preset.colors.primary }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: preset.colors.accent }}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: preset.colors.success }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-2 rounded"
                          style={{ background: preset.colors.text, width: '80%', opacity: 0.8 }}
                        />
                        <div
                          className="h-2 rounded"
                          style={{ background: preset.colors.textSecondary, width: '60%', opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                          {preset.name}
                          {isActive && <Check className="w-5 h-5 text-purple-400" />}
                        </h3>
                        <p className="text-sm text-white/60 leading-relaxed">{preset.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {!isActive && (
                        <>
                          <button
                            onClick={() => handleThemeSelect(preset.id)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handlePreview(preset.id)}
                            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        </>
                      )}
                      {isActive && (
                        <div className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl font-semibold text-sm text-purple-400 text-center">
                          Currently Active
                        </div>
                      )}
                    </div>

                    {/* Best For Badge */}
                    <div className="text-xs text-white/50 flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Best for: {preset.description.split('.').pop()?.trim() || 'All traders'}
                    </div>
                  </div>

                  {/* Effects Indicator */}
                  {preset.effects?.glassmorphism && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/80 border border-white/10">
                      Glassmorphism
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Light Themes */}
        {light.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Sun className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold">Light Themes</h2>
              <span className="text-sm text-white/60">({light.length} theme)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {light.map(preset => {
                const isActive = currentTheme.id === `theme-${preset.id}`;
                const isPreviewing = previewTheme === preset.id;

                return (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`group relative rounded-2xl border-2 transition-all overflow-hidden ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/10 shadow-xl shadow-purple-500/20'
                        : isPreviewing
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-purple-500/20 bg-slate-800/30 hover:border-purple-500/40'
                    }`}
                  >
                    {/* Theme Preview Colors */}
                    <div className="h-32 p-4" style={{ background: preset.colors.background }}>
                      <div
                        className="h-full rounded-xl p-3"
                        style={{
                          background: preset.colors.backgroundSecondary,
                          border: `1px solid ${preset.colors.border}`,
                        }}
                      >
                        <div className="flex gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: preset.colors.primary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: preset.colors.accent }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: preset.colors.success }}
                          />
                        </div>
                        <div className="space-y-1">
                          <div
                            className="h-2 rounded"
                            style={{ background: preset.colors.text, width: '80%', opacity: 0.8 }}
                          />
                          <div
                            className="h-2 rounded"
                            style={{
                              background: preset.colors.textSecondary,
                              width: '60%',
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            {preset.name}
                            {isActive && <Check className="w-5 h-5 text-purple-400" />}
                          </h3>
                          <p className="text-sm text-white/60 leading-relaxed">{preset.description}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!isActive && (
                          <>
                            <button
                              onClick={() => handleThemeSelect(preset.id)}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => handlePreview(preset.id)}
                              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                          </>
                        )}
                        {isActive && (
                          <div className="flex-1 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl font-semibold text-sm text-purple-400 text-center">
                            Currently Active
                          </div>
                        )}
                      </div>

                      {/* Best For Badge */}
                      <div className="text-xs text-white/50 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Best for: {preset.description.split('.').pop()?.trim() || 'All traders'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preview Mode Banner */}
        {previewTheme && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4"
          >
            <Eye className="w-5 h-5" />
            <span className="font-semibold">Preview Mode Active</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeSelect(previewTheme)}
                className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-all"
              >
                Apply
              </button>
              <button
                onClick={cancelPreview}
                className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Custom Theme Editor */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Custom Themes & Advanced Settings</h2>
          </div>

          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-white/80 leading-relaxed">
              Create your own custom themes with our powerful theme builder. Mix colors, adjust effects,
              and save unlimited custom themes. Export and share your themes with others.
            </p>
          </div>

          {!showCustomEditor && (
            <button
              onClick={() => setShowCustomEditor(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all"
            >
              <Palette className="w-5 h-5" />
              Open Theme Builder
            </button>
          )}

          {showCustomEditor && (
            <div className="space-y-6">
              <ThemeEditor />
              <button
                onClick={() => setShowCustomEditor(false)}
                className="px-6 py-3 bg-slate-800/70 hover:bg-slate-800/90 border border-purple-500/20 rounded-xl font-semibold transition-all"
              >
                Close Theme Builder
              </button>
            </div>
          )}
        </div>

        {/* Additional Features Coming Soon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/30 border border-purple-500/10 rounded-2xl p-6 space-y-3">
            <Clock className="w-8 h-8 text-purple-400" />
            <h3 className="font-bold text-lg">Scheduled Themes</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Automatically switch themes based on time of day. Perfect for day/night trading sessions.
            </p>
            <div className="text-xs text-white/40">Coming Soon</div>
          </div>

          <div className="bg-slate-800/30 border border-purple-500/10 rounded-2xl p-6 space-y-3">
            <Monitor className="w-8 h-8 text-purple-400" />
            <h3 className="font-bold text-lg">OS Theme Sync</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Respect your operating system's light/dark mode preferences automatically.
            </p>
            <div className="text-xs text-white/40">Coming Soon</div>
          </div>

          <div className="bg-slate-800/30 border border-purple-500/10 rounded-2xl p-6 space-y-3">
            <Eye className="w-8 h-8 text-purple-400" />
            <h3 className="font-bold text-lg">Accessibility Modes</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              High contrast, color blind modes, and focus mode for maximum accessibility.
            </p>
            <div className="text-xs text-white/40">Coming Soon</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
