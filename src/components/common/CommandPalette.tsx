import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  TrendingUp,
  BarChart3,
  Home,
  Settings,
  Calculator,
  Clock,
  Zap,
  ArrowRight,
  ArrowLeftRight,
} from 'lucide-react';
import { useCommandStore, CommandDefinition } from '../../store/commandStore';
import { useShortcutStore } from '../../store/shortcutStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, typeof Home> = {
  navigation: Home,
  trading: TrendingUp,
  analytics: BarChart3,
  workspace: Command,
  system: Settings,
  tools: Calculator,
};

const categoryLabels: Record<string, string> = {
  navigation: 'Navigation',
  trading: 'Trading',
  analytics: 'Analytics',
  workspace: 'Workspace',
  data: 'Data',
  system: 'System',
  tools: 'Tools',
};

type UnitType = 'length' | 'weight' | 'volume' | 'temperature';

interface UnitDefinition {
  type: UnitType;
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

interface ConversionResult {
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  formatted: string;
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  meter: {
    type: 'length',
    label: 'm',
    toBase: value => value,
    fromBase: value => value,
  },
  kilometer: {
    type: 'length',
    label: 'km',
    toBase: value => value * 1000,
    fromBase: value => value / 1000,
  },
  centimeter: {
    type: 'length',
    label: 'cm',
    toBase: value => value / 100,
    fromBase: value => value * 100,
  },
  millimeter: {
    type: 'length',
    label: 'mm',
    toBase: value => value / 1000,
    fromBase: value => value * 1000,
  },
  inch: {
    type: 'length',
    label: 'in',
    toBase: value => value * 0.0254,
    fromBase: value => value / 0.0254,
  },
  foot: {
    type: 'length',
    label: 'ft',
    toBase: value => value * 0.3048,
    fromBase: value => value / 0.3048,
  },
  yard: {
    type: 'length',
    label: 'yd',
    toBase: value => value * 0.9144,
    fromBase: value => value / 0.9144,
  },
  mile: {
    type: 'length',
    label: 'mi',
    toBase: value => value * 1609.34,
    fromBase: value => value / 1609.34,
  },
  kilogram: {
    type: 'weight',
    label: 'kg',
    toBase: value => value,
    fromBase: value => value,
  },
  gram: {
    type: 'weight',
    label: 'g',
    toBase: value => value / 1000,
    fromBase: value => value * 1000,
  },
  pound: {
    type: 'weight',
    label: 'lb',
    toBase: value => value * 0.45359237,
    fromBase: value => value / 0.45359237,
  },
  ounce: {
    type: 'weight',
    label: 'oz',
    toBase: value => value * 0.0283495,
    fromBase: value => value / 0.0283495,
  },
  liter: {
    type: 'volume',
    label: 'L',
    toBase: value => value,
    fromBase: value => value,
  },
  milliliter: {
    type: 'volume',
    label: 'mL',
    toBase: value => value / 1000,
    fromBase: value => value * 1000,
  },
  gallon: {
    type: 'volume',
    label: 'gal',
    toBase: value => value * 3.78541,
    fromBase: value => value / 3.78541,
  },
  quart: {
    type: 'volume',
    label: 'qt',
    toBase: value => value * 0.946353,
    fromBase: value => value / 0.946353,
  },
  celsius: {
    type: 'temperature',
    label: '°C',
    toBase: value => value,
    fromBase: value => value,
  },
  fahrenheit: {
    type: 'temperature',
    label: '°F',
    toBase: value => (value - 32) * (5 / 9),
    fromBase: value => value * (9 / 5) + 32,
  },
  kelvin: {
    type: 'temperature',
    label: 'K',
    toBase: value => value - 273.15,
    fromBase: value => value + 273.15,
  },
};

const UNIT_ALIASES: Record<string, string> = {
  m: 'meter',
  meters: 'meter',
  metre: 'meter',
  metres: 'meter',
  km: 'kilometer',
  kms: 'kilometer',
  centimeters: 'centimeter',
  cms: 'centimeter',
  cm: 'centimeter',
  mm: 'millimeter',
  mms: 'millimeter',
  inches: 'inch',
  in: 'inch',
  ft: 'foot',
  feet: 'foot',
  yards: 'yard',
  yd: 'yard',
  yds: 'yard',
  miles: 'mile',
  mi: 'mile',
  kilogram: 'kilogram',
  kilograms: 'kilogram',
  kg: 'kilogram',
  kgs: 'kilogram',
  gram: 'gram',
  grams: 'gram',
  g: 'gram',
  gs: 'gram',
  pound: 'pound',
  pounds: 'pound',
  lb: 'pound',
  lbs: 'pound',
  ounce: 'ounce',
  ounces: 'ounce',
  oz: 'ounce',
  liter: 'liter',
  liters: 'liter',
  litre: 'liter',
  litres: 'liter',
  l: 'liter',
  milliliter: 'milliliter',
  milliliters: 'milliliter',
  millilitre: 'milliliter',
  millilitres: 'milliliter',
  ml: 'milliliter',
  gallon: 'gallon',
  gallons: 'gallon',
  gal: 'gallon',
  quart: 'quart',
  quarts: 'quart',
  qt: 'quart',
  c: 'celsius',
  '°c': 'celsius',
  celsius: 'celsius',
  centigrade: 'celsius',
  f: 'fahrenheit',
  '°f': 'fahrenheit',
  fahrenheit: 'fahrenheit',
  kelvin: 'kelvin',
  k: 'kelvin',
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return parseFloat(value.toFixed(6)).toString();
};

const normalizeUnit = (input: string) => {
  const cleaned = input.replace(/degrees?/gi, '').replace(/°/g, '').trim().toLowerCase();
  return UNIT_ALIASES[cleaned] || cleaned;
};

const parseUnitConversion = (input: string): ConversionResult | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const connectorMatch = trimmed.match(/\s+(to|in)\s+/i);
  if (!connectorMatch) return null;

  const [left, right] = trimmed.split(new RegExp(`\s+${connectorMatch[1]}\s+`, 'i'));
  if (!left || !right) return null;

  const valueMatch = left.trim().match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!valueMatch) return null;

  const fromValue = parseFloat(valueMatch[1]);
  if (Number.isNaN(fromValue)) return null;

  const fromUnitRaw = valueMatch[2].trim() || right.trim().split(/\s+/)[0];
  const toUnitRaw = right.trim();

  const normalizedFrom = normalizeUnit(fromUnitRaw);
  const normalizedTo = normalizeUnit(toUnitRaw);

  const fromDefinition = UNIT_DEFINITIONS[normalizedFrom];
  const toDefinition = UNIT_DEFINITIONS[normalizedTo];

  if (!fromDefinition || !toDefinition || fromDefinition.type !== toDefinition.type) {
    return null;
  }

  let baseValue = fromDefinition.toBase(fromValue);
  let convertedValue = toDefinition.fromBase(baseValue);

  if (!Number.isFinite(convertedValue)) {
    return null;
  }

  const formatted = `${formatNumber(fromValue)} ${fromDefinition.label} = ${formatNumber(convertedValue)} ${toDefinition.label}`;

  return {
    fromValue,
    fromUnit: fromDefinition.label,
    toValue: convertedValue,
    toUnit: toDefinition.label,
    formatted,
  };
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'command' | 'calculator' | 'conversion'>('command');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const { commands, recentCommands, executeCommand } = useCommandStore();
  const { shortcuts } = useShortcutStore();

  const allCommands = useMemo(() => Object.values(commands), [commands]);

  const filteredCommands = useMemo(() => {
    if (mode === 'calculator' || mode === 'conversion') return [];

    if (!query.trim()) {
      const recentIds = recentCommands
        .slice(0, 5)
        .map(usage => usage.commandId)
        .filter(id => commands[id]);
      return recentIds.map(id => commands[id]);
    }

    const lowerQuery = query.toLowerCase();
    return allCommands
      .filter(cmd => {
        const titleMatch = cmd.title.toLowerCase().includes(lowerQuery);
        const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
        const keywordMatch = cmd.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery));
        return titleMatch || descMatch || keywordMatch;
      })
      .sort((a, b) => {
        const aScore = a.title.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        const bScore = b.title.toLowerCase().startsWith(lowerQuery) ? 1 : 0;
        return bScore - aScore;
      });
  }, [query, allCommands, recentCommands, commands, mode]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandDefinition[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const getShortcutKeys = useCallback(
    (commandId: string) => {
      const command = commands[commandId];
      if (!command?.shortcutId) return null;
      const shortcut = shortcuts.find(s => s.action === command.shortcutId);
      return shortcut?.keys;
    },
    [commands, shortcuts]
  );

  const handleCalculator = useCallback((input: string) => {
    try {
      const sanitized = input.replace(/[^0-9+\-*/().]/g, '');
      if (!sanitized) {
        setCalcResult(null);
        return;
      }
      const result = eval(sanitized);
      setCalcResult(String(result));
    } catch (error) {
      setCalcResult('Invalid expression');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setMode('command');
      setCalcResult(null);
      setConversionResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, mode]);

  useEffect(() => {
    const unitConversion = parseUnitConversion(query);
    if (unitConversion) {
      setMode('conversion');
      setConversionResult(unitConversion);
      setCalcResult(null);
    } else if (query.match(/^[0-9+\-*/().]+$/)) {
      setMode('calculator');
      handleCalculator(query);
      setConversionResult(null);
    } else if (mode !== 'command') {
      setMode('command');
      setCalcResult(null);
      setConversionResult(null);
    }
  }, [query, mode, handleCalculator]);

  const handleSelect = useCallback(
    async (commandId: string) => {
      await executeCommand(commandId);
      onClose();
    },
    [executeCommand, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (mode === 'calculator' && calcResult) {
          navigator.clipboard.writeText(calcResult);
          onClose();
        } else if (mode === 'conversion' && conversionResult) {
          navigator.clipboard.writeText(conversionResult.formatted);
          onClose();
        } else if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex].id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, handleSelect, onClose, mode, calcResult, conversionResult]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-2xl mx-4"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
            <div className="relative border-b border-purple-500/20">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'calculator'
                    ? 'Type a calculation...'
                    : mode === 'conversion'
                      ? 'Type a conversion (e.g. 10 kg to lb)'
                      : 'Search commands, conversions, or calculations...'
                }
                className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-lg"
                autoFocus
              />
              {mode === 'command' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-white/40">
                  <kbd className="px-2 py-1 bg-slate-800/50 rounded border border-purple-500/20">↑↓</kbd>
                  <span>Navigate</span>
                  <kbd className="px-2 py-1 bg-slate-800/50 rounded border border-purple-500/20">↵</kbd>
                  <span>Select</span>
                </div>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {mode === 'calculator' && calcResult && (
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-sm text-white/60">Result</div>
                        <div className="text-2xl font-bold text-white">{calcResult}</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">
                      Press <kbd className="px-2 py-1 bg-slate-800/50 rounded">↵</kbd> to copy
                    </div>
                  </div>
                </div>
              )}
              
              {mode === 'conversion' && conversionResult && (
                <div className="p-4 border-b border-purple-500/20">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-white/60">Conversion</div>
                        <div className="text-2xl font-bold text-white">{conversionResult.formatted}</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">
                      Press <kbd className="px-2 py-1 bg-slate-800/50 rounded">↵</kbd> to copy
                    </div>
                  </div>
                </div>
              )}

              {mode === 'command' && !query && filteredCommands.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/40">
                    <Clock className="w-4 h-4" />
                    <span>Recent</span>
                  </div>
                  {filteredCommands.map((cmd, index) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={index === selectedIndex}
                      shortcutKeys={getShortcutKeys(cmd.id)}
                      onSelect={() => handleSelect(cmd.id)}
                    />
                  ))}
                </div>
              )}

              {mode === 'command' && query && Object.keys(groupedCommands).length > 0 && (
                <div className="p-2">
                  {Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category} className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/40">
                        {categoryIcons[category] &&
                          (() => {
                            const Icon = categoryIcons[category];
                            return <Icon className="w-4 h-4" />;
                          })()}
                        <span>{categoryLabels[category] || category}</span>
                      </div>
                      {commands.map((cmd, index) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        return (
                          <CommandItem
                            key={cmd.id}
                            command={cmd}
                            isSelected={globalIndex === selectedIndex}
                            shortcutKeys={getShortcutKeys(cmd.id)}
                            onSelect={() => handleSelect(cmd.id)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {mode === 'command' && filteredCommands.length === 0 && query && (
                <div className="p-8 text-center text-white/40">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No commands found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              )}

              {mode === 'command' && !query && filteredCommands.length === 0 && (
                <div className="p-8 text-center text-white/40">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No recent commands</p>
                  <p className="text-sm mt-2">Start typing to search commands</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface CommandItemProps {
  command: CommandDefinition;
  isSelected: boolean;
  shortcutKeys: string | null;
  onSelect: () => void;
}

function CommandItem({ command, isSelected, shortcutKeys, onSelect }: CommandItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
        isSelected
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {categoryIcons[command.category] &&
          (() => {
            const Icon = categoryIcons[command.category];
            return <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />;
          })()}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-white truncate">{command.title}</div>
          {command.description && (
            <div className="text-xs text-white/60 truncate">{command.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {shortcutKeys && (
          <kbd className="px-2 py-1 text-xs bg-slate-800/50 rounded border border-purple-500/20 text-white/60">
            {shortcutKeys}
          </kbd>
        )}
        {isSelected && <ArrowRight className="w-4 h-4 text-purple-400" />}
      </div>
    </button>
  );
}
