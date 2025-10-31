import { useState } from 'react';
import { Plus, Trash2, Copy, Save, Play, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RuleNode {
  id?: string;
  label?: string;
  condition?: Condition;
  group?: RuleGroup;
  metadata?: any;
}

interface RuleGroup {
  operator: 'and' | 'or';
  nodes: RuleNode[];
  windowMinutes?: number;
  label?: string;
  description?: string;
}

interface Condition {
  id?: string;
  conditionType: ConditionType;
  parameters: ConditionParameters;
  description?: string;
}

type ConditionType =
  | 'above'
  | 'below'
  | 'percent_change'
  | 'volume_spike'
  | 'whale_transaction'
  | 'time_window'
  | 'market_cap'
  | 'liquidity'
  | 'trading_volume'
  | 'price_range'
  | 'volatility'
  | 'trend_change';

interface ConditionParameters {
  threshold?: number;
  minValue?: number;
  maxValue?: number;
  timeframeMinutes?: number;
  whaleThresholdUsd?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  comparisonOperator?: string;
}

interface LogicBuilderProps {
  value: RuleNode;
  onChange: (value: RuleNode) => void;
  onTest?: () => void;
}

const CONDITION_TYPES: { value: ConditionType; label: string; description: string }[] = [
  { value: 'above', label: 'Price Above', description: 'Trigger when price exceeds threshold' },
  { value: 'below', label: 'Price Below', description: 'Trigger when price drops below threshold' },
  { value: 'percent_change', label: 'Percent Change', description: 'Monitor price % change over time' },
  { value: 'volume_spike', label: 'Volume Spike', description: 'Detect unusual trading volume' },
  { value: 'whale_transaction', label: 'Whale Transaction', description: 'Track large wallet movements' },
  { value: 'time_window', label: 'Time Window', description: 'Restrict to specific times' },
  { value: 'market_cap', label: 'Market Cap', description: 'Monitor market capitalization' },
  { value: 'liquidity', label: 'Liquidity', description: 'Check liquidity thresholds' },
  { value: 'trading_volume', label: 'Trading Volume', description: 'Monitor 24h volume' },
  { value: 'price_range', label: 'Price Range', description: 'Price within specific range' },
  { value: 'volatility', label: 'Volatility', description: 'Detect volatility spikes' },
  { value: 'trend_change', label: 'Trend Change', description: 'Identify momentum shifts' },
];

const LogicBuilder = ({ value, onChange, onTest }: LogicBuilderProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: RuleNode, path: number[] = [], depth: number = 0): JSX.Element => {
    const nodeId = node.id || path.join('-');
    const isExpanded = expandedNodes.has(nodeId);

    if (node.condition) {
      return renderCondition(node.condition, path, depth);
    }

    if (node.group) {
      return renderGroup(node.group, nodeId, path, depth, isExpanded);
    }

    return (
      <div className="p-4 bg-slate-800/40 border border-purple-500/20 rounded-xl">
        <p className="text-slate-400 text-sm">Empty node</p>
        <button
          onClick={() => addCondition(path)}
          className="mt-2 text-xs text-purple-400 hover:text-purple-300"
        >
          + Add Condition
        </button>
      </div>
    );
  };

  const renderGroup = (
    group: RuleGroup,
    nodeId: string,
    path: number[],
    depth: number,
    isExpanded: boolean
  ): JSX.Element => {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl ${
          group.operator === 'and'
            ? 'border-blue-500/30 bg-blue-500/5'
            : 'border-orange-500/30 bg-orange-500/5'
        }`}
        style={{ marginLeft: depth > 0 ? '2rem' : 0 }}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleNode(nodeId)}
              className="p-1 hover:bg-white/5 rounded transition"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▶
              </motion.div>
            </button>
            <button
              onClick={() => toggleOperator(path)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                group.operator === 'and'
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
              }`}
            >
              {group.operator.toUpperCase()}
            </button>
            <span className="text-sm text-slate-300">
              {group.label || 'Condition Group'} ({group.nodes.length} nodes)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {group.windowMinutes && (
              <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800/60 rounded">
                {group.windowMinutes}min window
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => addGroupToGroup(path)}
                className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition text-xs"
              >
                + Group
              </button>
              <button
                onClick={() => addNodeToGroup(path)}
                className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition text-xs"
              >
                + Condition
              </button>
            </div>
            {depth > 0 && (
              <button
                onClick={() => removeNode(path)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                title="Remove Group"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2">
                {group.nodes.map((childNode, idx) => (
                  <div key={idx}>{renderNode(childNode, [...path, idx], depth + 1)}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderCondition = (condition: Condition, path: number[], depth: number): JSX.Element => {
    const conditionInfo = CONDITION_TYPES.find(c => c.value === condition.conditionType);

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 bg-slate-800/60 border border-purple-500/20 rounded-xl"
        style={{ marginLeft: depth > 0 ? '2rem' : 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Condition Type</label>
              <select
                value={condition.conditionType}
                onChange={e => updateCondition(path, { conditionType: e.target.value as ConditionType })}
                className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              >
                {CONDITION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {conditionInfo && (
                <p className="text-xs text-slate-500 mt-1">{conditionInfo.description}</p>
              )}
            </div>

            {renderConditionParameters(condition, path)}
          </div>

          <button
            onClick={() => removeNode(path)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
            title="Remove Condition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderConditionParameters = (condition: Condition, path: number[]): JSX.Element => {
    const params = condition.parameters || {};

    switch (condition.conditionType) {
      case 'above':
      case 'below':
      case 'volume_spike':
      case 'trading_volume':
      case 'liquidity':
      case 'market_cap':
      case 'volatility':
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Threshold</label>
            <input
              type="number"
              step="0.000001"
              value={params.threshold || ''}
              onChange={e => updateCondition(path, { 
                parameters: { ...params, threshold: parseFloat(e.target.value) || 0 }
              })}
              placeholder="Enter threshold value"
              className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
            />
          </div>
        );

      case 'price_range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Min Price</label>
              <input
                type="number"
                step="0.000001"
                value={params.minValue || ''}
                onChange={e => updateCondition(path, { 
                  parameters: { ...params, minValue: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max Price</label>
              <input
                type="number"
                step="0.000001"
                value={params.maxValue || ''}
                onChange={e => updateCondition(path, { 
                  parameters: { ...params, maxValue: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              />
            </div>
          </div>
        );

      case 'percent_change':
      case 'trend_change':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Threshold (%)</label>
              <input
                type="number"
                step="0.1"
                value={params.threshold || ''}
                onChange={e => updateCondition(path, { 
                  parameters: { ...params, threshold: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Timeframe (min)</label>
              <input
                type="number"
                min="1"
                value={params.timeframeMinutes || ''}
                onChange={e => updateCondition(path, { 
                  parameters: { ...params, timeframeMinutes: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
              />
            </div>
          </div>
        );

      case 'whale_transaction':
        return (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Min Transaction (USD)</label>
            <input
              type="number"
              step="1000"
              value={params.whaleThresholdUsd || ''}
              onChange={e => updateCondition(path, { 
                parameters: { ...params, whaleThresholdUsd: parseFloat(e.target.value) || 0 }
              })}
              placeholder="e.g., 100000"
              className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
            />
          </div>
        );

      case 'time_window':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={params.startTime || ''}
                  onChange={e => updateCondition(path, { 
                    parameters: { ...params, startTime: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Time</label>
                <input
                  type="time"
                  value={params.endTime || ''}
                  onChange={e => updateCondition(path, { 
                    parameters: { ...params, endTime: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Days of Week</label>
              <div className="flex gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => toggleDayOfWeek(path, idx + 1)}
                    className={`flex-1 px-2 py-1 text-xs rounded transition ${
                      (params.daysOfWeek || []).includes(idx + 1)
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return <></>;
    }
  };

  const updateCondition = (path: number[], updates: Partial<Condition>) => {
    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length - 1; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group && path.length > 0) {
      const lastIdx = path[path.length - 1];
      const node = target.group.nodes[lastIdx];
      if (node.condition) {
        Object.assign(node.condition, updates);
      }
    } else if (target.condition) {
      Object.assign(target.condition, updates);
    }

    onChange(newValue);
  };

  const toggleDayOfWeek = (path: number[], day: number) => {
    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length - 1; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group && path.length > 0) {
      const lastIdx = path[path.length - 1];
      const node = target.group.nodes[lastIdx];
      if (node.condition) {
        const days = node.condition.parameters.daysOfWeek || [];
        if (days.includes(day)) {
          node.condition.parameters.daysOfWeek = days.filter((d: number) => d !== day);
        } else {
          node.condition.parameters.daysOfWeek = [...days, day];
        }
      }
    }

    onChange(newValue);
  };

  const toggleOperator = (path: number[]) => {
    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group) {
      target.group.operator = target.group.operator === 'and' ? 'or' : 'and';
    }

    onChange(newValue);
  };

  const addCondition = (path: number[]) => {
    const newValue = JSON.parse(JSON.stringify(value));
    const newCondition: RuleNode = {
      id: `cond-${Date.now()}`,
      condition: {
        conditionType: 'above',
        parameters: { threshold: 0 },
      },
    };

    if (path.length === 0) {
      onChange(newCondition);
    } else {
      let target: any = newValue;
      for (let i = 0; i < path.length; i++) {
        if (target.group) {
          target = target.group.nodes[path[i]];
        }
      }
      if (target.group) {
        target.group.nodes.push(newCondition);
      }
      onChange(newValue);
    }
  };

  const addNodeToGroup = (path: number[]) => {
    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group) {
      target.group.nodes.push({
        id: `cond-${Date.now()}`,
        condition: {
          conditionType: 'above',
          parameters: { threshold: 0 },
        },
      });
    }

    onChange(newValue);
  };

  const addGroupToGroup = (path: number[]) => {
    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group) {
      target.group.nodes.push({
        id: `group-${Date.now()}`,
        label: 'New Group',
        group: {
          operator: 'and',
          nodes: [
            {
              id: `cond-${Date.now()}`,
              condition: {
                conditionType: 'above',
                parameters: { threshold: 0 },
              },
            },
          ],
        },
      });
    }

    onChange(newValue);
  };

  const removeNode = (path: number[]) => {
    if (path.length === 0) return;

    const newValue = JSON.parse(JSON.stringify(value));
    let target: any = newValue;

    for (let i = 0; i < path.length - 1; i++) {
      if (target.group) {
        target = target.group.nodes[path[i]];
      }
    }

    if (target.group) {
      const lastIdx = path[path.length - 1];
      target.group.nodes.splice(lastIdx, 1);
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">Rule Logic Builder</h3>
        <div className="flex items-center gap-2">
          {onTest && (
            <button
              onClick={onTest}
              className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 flex items-center gap-2 transition text-sm"
            >
              <Play className="w-4 h-4" />
              Test Rule
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-purple-500/20 rounded-xl p-4">
        {renderNode(value)}
      </div>

      <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-200/80">
          Test your rules with dry-run simulation before enabling to ensure they work as expected.
        </p>
      </div>
    </div>
  );
};

export default LogicBuilder;
