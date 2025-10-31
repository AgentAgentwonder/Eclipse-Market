import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { CalendarClock } from 'lucide-react';

interface VestingScheduleProps {
  launchId: string | null;
}

export default function VestingSchedule({ launchId }: VestingScheduleProps) {
  const [tokenMint, setTokenMint] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [cliffDuration, setCliffDuration] = useState(30);
  const [vestingDuration, setVestingDuration] = useState(365);

  const handleCreate = async () => {
    try {
      await invoke('create_vesting_schedule', {
        request: {
          tokenMint,
          beneficiary,
          totalAmount,
          startDate: new Date(startDate).toISOString(),
          cliffDurationSeconds: cliffDuration * 86400,
          vestingDurationSeconds: vestingDuration * 86400,
          vestingType: 'linear',
          stages: null,
        },
      });
    } catch (err) {
      console.error('Failed to create vesting schedule:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Vesting Schedule Builder
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Mint</label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beneficiary Address</label>
          <input
            type="text"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliff (days)</label>
            <input
              type="number"
              value={cliffDuration}
              onChange={(e) => setCliffDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (days)</label>
            <input
              type="number"
              value={vestingDuration}
              onChange={(e) => setVestingDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
          />
        </div>

        <button
          onClick={handleCreate}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
        >
          Create Vesting Schedule
        </button>
      </div>
    </div>
  );
}
