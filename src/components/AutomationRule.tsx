import { useState } from 'react';
import { invoke } from '@tauri-apps/api';

export function AutomationRule() {
  const [name, setName] = useState('');
  const [condition, setCondition] = useState('');
  const [action, setAction] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke('add_automation_rule', { name, condition, action });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Create Automation Rule</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Rule Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Condition</label>
          <textarea
            value={condition}
            onChange={e => setCondition(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded h-20"
            placeholder="bid > 100 && ask < 105"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Action</label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded h-20"
            placeholder="execute_swap('SOL', 'USDC', 1.0)"
            required
          />
        </div>

        <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded">
          Create Rule
        </button>

        {success && <div className="text-green-400 text-sm mt-2">Rule created successfully!</div>}
      </form>
    </div>
  );
}
