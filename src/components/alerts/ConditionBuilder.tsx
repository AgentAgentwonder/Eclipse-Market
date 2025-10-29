import { Plus, Trash2 } from 'lucide-react';
import {
  AlertConditionType,
  LogicalOperator,
  CompoundCondition,
  AlertCondition,
} from '../../store/alertStore';

interface ConditionBuilderProps {
  value: CompoundCondition;
  onChange: (value: CompoundCondition) => void;
}

const ConditionBuilder = ({ value, onChange }: ConditionBuilderProps) => {
  const addCondition = () => {
    onChange({
      ...value,
      conditions: [
        ...value.conditions,
        { conditionType: 'above', value: 100, timeframeMinutes: null },
      ],
    });
  };

  const removeCondition = (index: number) => {
    if (value.conditions.length === 1) return;
    onChange({
      ...value,
      conditions: value.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, condition: Partial<AlertCondition>) => {
    onChange({
      ...value,
      conditions: value.conditions.map((c, i) => (i === index ? { ...c, ...condition } : c)),
    });
  };

  const toggleOperator = () => {
    onChange({
      ...value,
      operator: value.operator === 'and' ? 'or' : 'and',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">Conditions</p>
        {value.conditions.length > 1 && (
          <button
            type="button"
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              value.operator === 'and'
                ? 'bg-blue-500/20 text-blue-300'
                : 'bg-orange-500/20 text-orange-300'
            }`}
            onClick={toggleOperator}
          >
            {value.operator.toUpperCase()}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {value.conditions.map((condition, index) => (
          <div
            key={index}
            className="flex items-center gap-3 bg-slate-800/60 border border-purple-500/10 rounded-2xl p-4"
          >
            <select
              value={condition.conditionType}
              onChange={e =>
                updateCondition(index, { conditionType: e.target.value as AlertConditionType })
              }
              className="flex-1 px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
            >
              <option value="above">Price Above</option>
              <option value="below">Price Below</option>
              <option value="percent_change">Percent Change</option>
              <option value="volume_spike">Volume Spike</option>
            </select>

            <input
              type="number"
              step="0.01"
              value={condition.value}
              onChange={e => updateCondition(index, { value: parseFloat(e.target.value) })}
              placeholder={condition.conditionType === 'volume_spike' ? 'Volume ($)' : 'Value'}
              className="w-32 px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
            />

            {(condition.conditionType === 'percent_change' ||
              condition.conditionType === 'volume_spike') && (
              <input
                type="number"
                min={1}
                value={condition.timeframeMinutes ?? 1440}
                onChange={e =>
                  updateCondition(index, { timeframeMinutes: parseInt(e.target.value) })
                }
                placeholder="Timeframe (min)"
                className="w-32 px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              />
            )}

            {value.conditions.length > 1 && (
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                onClick={() => removeCondition(index)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full px-4 py-2 rounded-xl bg-slate-800/60 border border-purple-500/20 hover:bg-slate-800 hover:border-purple-500/40 flex items-center justify-center gap-2 transition text-sm"
        onClick={addCondition}
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </button>
    </div>
  );
};

export default ConditionBuilder;
