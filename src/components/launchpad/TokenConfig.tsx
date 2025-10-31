import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Zap } from 'lucide-react';

interface TokenMetadata {
  description: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

interface CreateTokenRequest {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  metadata: TokenMetadata;
}

interface TokenLaunchConfig {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  description: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface SimulationResult {
  success: boolean;
  computeUnits: number;
  feeEstimate: number;
  logs: string[];
  warnings: string[];
  error?: string;
}

interface SafetyCheckResult {
  checkName: string;
  passed: boolean;
  severity: string;
  message: string;
  recommendation?: string;
}

interface LaunchSafetyCheck {
  passed: boolean;
  securityScore: number;
  riskLevel: string;
  checks: SafetyCheckResult[];
  timestamp: string;
}

interface TokenConfigProps {
  onLaunchCreated: (launchId: string) => void;
}

export default function TokenConfig({ onLaunchCreated }: TokenConfigProps) {
  const [form, setForm] = useState<CreateTokenRequest>({
    name: '',
    symbol: '',
    decimals: 9,
    totalSupply: 1_000_000,
    mintAuthorityEnabled: false,
    freezeAuthorityEnabled: false,
    metadata: {
      description: '',
      imageUrl: '',
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
    },
  });
  const [launchConfig, setLaunchConfig] = useState<TokenLaunchConfig | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<LaunchSafetyCheck | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    field: keyof CreateTokenRequest,
    value: string | number | boolean | TokenMetadata
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetadataChange = (field: keyof TokenMetadata, value: string) => {
    setForm(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleCreateDraft = async () => {
    setError(null);
    try {
      const response = await invoke<TokenLaunchConfig>('create_launch_config', {
        name: form.name,
        symbol: form.symbol,
        decimals: form.decimals,
        totalSupply: form.totalSupply,
        description: form.metadata.description,
        metadata: {
          imageUrl: form.metadata.imageUrl,
          website: form.metadata.website,
          twitter: form.metadata.twitter,
          telegram: form.metadata.telegram,
          discord: form.metadata.discord,
        },
      });
      setLaunchConfig(response);
      onLaunchCreated(response.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create launch config');
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      const simResult = await invoke<SimulationResult>('simulate_token_creation', {
        request: {
          name: form.name,
          symbol: form.symbol,
          decimals: form.decimals,
          totalSupply: form.totalSupply,
          mintAuthorityEnabled: form.mintAuthorityEnabled,
          freezeAuthorityEnabled: form.freezeAuthorityEnabled,
          metadata: form.metadata,
        },
      });
      setSimulation(simResult);

      const safetyResult = await invoke<LaunchSafetyCheck>('check_launch_safety', {
        config: {
          id: launchConfig?.id ?? '',
          name: form.name,
          symbol: form.symbol,
          decimals: form.decimals,
          totalSupply: form.totalSupply,
          description: form.metadata.description,
          imageUrl: form.metadata.imageUrl,
          website: form.metadata.website,
          twitter: form.metadata.twitter,
          telegram: form.metadata.telegram,
          discord: form.metadata.discord,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'simulated',
          creatorAddress: '',
          mintAuthorityEnabled: form.mintAuthorityEnabled,
          freezeAuthorityEnabled: form.freezeAuthorityEnabled,
        },
      });
      setSafetyCheck(safetyResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setError(null);
    try {
      const result = await invoke<{ success: boolean; mintAddress: string }>('launchpad_create_token', {
        request: {
          name: form.name,
          symbol: form.symbol,
          decimals: form.decimals,
          totalSupply: form.totalSupply,
          mintAuthorityEnabled: form.mintAuthorityEnabled,
          freezeAuthorityEnabled: form.freezeAuthorityEnabled,
          metadata: form.metadata,
        },
      });

      if (!result.success) {
        throw new Error('Token creation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter token name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Symbol
                </label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={e => handleChange('symbol', e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. LAUNCH"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Decimals
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={form.decimals}
                    onChange={e => handleChange('decimals', Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Supply
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.totalSupply}
                    onChange={e => handleChange('totalSupply', Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.mintAuthorityEnabled}
                    onChange={e => handleChange('mintAuthorityEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Enable mint authority
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.freezeAuthorityEnabled}
                    onChange={e => handleChange('freezeAuthorityEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Enable freeze authority
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={form.metadata.description}
                  onChange={e => handleMetadataChange('description', e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Write a compelling description for your token launch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <input
                    type="url"
                    value={form.metadata.website}
                    onChange={e => handleMetadataChange('website', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={form.metadata.twitter}
                    onChange={e => handleMetadataChange('twitter', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={form.metadata.telegram}
                    onChange={e => handleMetadataChange('telegram', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discord
                  </label>
                  <input
                    type="text"
                    value={form.metadata.discord}
                    onChange={e => handleMetadataChange('discord', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleCreateDraft}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Zap className="w-4 h-4" />
              Save Draft
            </button>

            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-600 px-4 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isSimulating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Simulate & Check Safety
            </button>

            <button
              onClick={handleLaunch}
              disabled={isLaunching || !launchConfig}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLaunching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Launch Token
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {simulation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Simulation Result</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Compute Units</span>
                <span className="font-medium text-gray-900 dark:text-white">{simulation.computeUnits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fee Estimate</span>
                <span className="font-medium text-gray-900 dark:text-white">{simulation.feeEstimate.toLocaleString()} lamports</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 block mb-1">Logs</span>
                <ul className="space-y-1 text-gray-900 dark:text-gray-100">
                  {simulation.logs.map((log, idx) => (
                    <li key={idx} className="rounded bg-gray-100 dark:bg-gray-900/60 px-3 py-1">{log}</li>
                  ))}
                </ul>
              </div>
              {simulation.warnings.length > 0 && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block mb-1">Warnings</span>
                  <ul className="space-y-1 text-amber-600 dark:text-amber-400">
                    {simulation.warnings.map((warning, idx) => (
                      <li key={idx} className="rounded bg-amber-100/80 dark:bg-amber-900/20 px-3 py-1">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {safetyCheck && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Safety & Compliance
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Security Score</div>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {safetyCheck.securityScore}
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    {safetyCheck.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-2">
                  {safetyCheck.checks.map((check) => (
                    <div key={check.checkName} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {check.checkName}
                        </span>
                        <span className={`text-xs font-semibold ${check.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                          {check.passed ? 'PASSED' : 'ATTENTION'}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">{check.message}</p>
                      {check.recommendation && (
                        <p className="mt-2 text-xs text-purple-500 dark:text-purple-300">{check.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
