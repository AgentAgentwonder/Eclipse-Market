import { useState } from 'react';
import { invoke } from '@tauri-apps/api';

export function ApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [service, setService] = useState('helius');
  const [path, setPath] = useState('/v1/prices');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await invoke('fetch_api_data', { apiKey, service, path });
      setResponse(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">API Integration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Service</label>
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
          >
            <option value="helius">Helius</option>
            <option value="birdeye">Birdeye</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="Enter API key"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Endpoint Path</label>
          <input
            type="text"
            value={path}
            onChange={e => setPath(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="/v1/endpoint"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </form>

      {response && (
        <div className="mt-4 p-4 bg-gray-900 rounded overflow-auto max-h-64">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
