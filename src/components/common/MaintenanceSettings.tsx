import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, X, Clock, Calendar, Trash2, Edit2, Power } from 'lucide-react';
import { useMaintenanceStore } from '../../store/maintenanceStore';

export function MaintenanceSettings() {
  const {
    isMaintenanceMode,
    currentMaintenance,
    schedules,
    setMaintenanceMode,
    addSchedule,
    removeSchedule,
    updateSchedule,
    checkSchedules,
  } = useMaintenanceStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    startTime: '',
    endTime: '',
    disableTrading: true,
    recurring: '' as '' | 'daily' | 'weekly' | 'monthly',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      checkSchedules();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkSchedules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateSchedule(editingId, {
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        recurring: formData.recurring || undefined,
      });
      setEditingId(null);
    } else {
      addSchedule({
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        recurring: formData.recurring || undefined,
      });
    }

    setFormData({
      message: '',
      startTime: '',
      endTime: '',
      disableTrading: true,
      recurring: '',
    });
    setShowAddForm(false);
  };

  const handleEdit = (schedule: any) => {
    setFormData({
      message: schedule.message,
      startTime: new Date(schedule.startTime).toISOString().slice(0, 16),
      endTime: new Date(schedule.endTime).toISOString().slice(0, 16),
      disableTrading: schedule.disableTrading,
      recurring: schedule.recurring || '',
    });
    setEditingId(schedule.id);
    setShowAddForm(true);
  };

  const toggleMaintenanceMode = () => {
    if (isMaintenanceMode) {
      setMaintenanceMode(false);
    } else {
      const message = prompt('Enter maintenance message:');
      if (message) {
        setMaintenanceMode(true, message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Mode</h2>
          <p className="text-sm text-slate-400">Schedule and manage maintenance windows</p>
        </div>
        <button
          onClick={toggleMaintenanceMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            isMaintenanceMode
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
          }`}
        >
          <Power className="w-4 h-4" />
          {isMaintenanceMode ? 'End Maintenance' : 'Start Maintenance'}
        </button>
      </div>

      {isMaintenanceMode && currentMaintenance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-400">Maintenance Active</h3>
              <p className="text-sm text-slate-400 mt-1">{currentMaintenance.message}</p>
              <p className="text-xs text-slate-500 mt-2">
                Ends: {new Date(currentMaintenance.endTime).toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scheduled Maintenance</h3>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) {
              setEditingId(null);
              setFormData({
                message: '',
                startTime: '',
                endTime: '',
                disableTrading: true,
                recurring: '',
              });
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add Schedule'}
        </button>
      </div>

      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit}
          className="bg-slate-900/50 rounded-xl p-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <input
              type="text"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              placeholder="System maintenance in progress"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recurring</label>
            <select
              value={formData.recurring}
              onChange={e =>
                setFormData({
                  ...formData,
                  recurring: e.target.value as '' | 'daily' | 'weekly' | 'monthly',
                })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:border-purple-500 focus:outline-none"
            >
              <option value="">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.disableTrading}
              onChange={e => setFormData({ ...formData, disableTrading: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Disable trading during maintenance</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              {editingId ? 'Update Schedule' : 'Add Schedule'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
                setFormData({
                  message: '',
                  startTime: '',
                  endTime: '',
                  disableTrading: true,
                  recurring: '',
                });
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No scheduled maintenance</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div
              key={schedule.id}
              className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{schedule.message}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(schedule.startTime).toLocaleString()}</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(schedule.endTime).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {schedule.disableTrading && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        Trading Disabled
                      </span>
                    )}
                    {schedule.recurring && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs capitalize">
                        {schedule.recurring}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-1.5 hover:bg-purple-500/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    onClick={() => removeSchedule(schedule.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
