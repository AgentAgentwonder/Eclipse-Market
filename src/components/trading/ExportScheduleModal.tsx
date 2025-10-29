import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Mail,
  Webhook,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useTradeReportingStore } from '../../store/tradeReportingStore';
import {
  ExportSchedule,
  ScheduleCadence,
  DeliveryMethod,
  ExportPreset,
  ExportFormat,
} from '../../types/tradeReporting';
import { format } from 'date-fns';

interface ExportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportScheduleModal({ isOpen, onClose }: ExportScheduleModalProps) {
  const { schedules, addSchedule, deleteSchedule, toggleSchedule, createDefaultExportConfig } =
    useTradeReportingStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cadence: 'daily' as ScheduleCadence,
    customIntervalMinutes: 60,
    preset: 'custom' as ExportPreset,
    format: 'csv' as ExportFormat,
    deliveryMethod: 'email' as DeliveryMethod,
    email: '',
    webhookUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const exportConfig = createDefaultExportConfig(formData.preset, formData.format);

    const newSchedule: Omit<ExportSchedule, 'id' | 'createdAt'> = {
      name: formData.name,
      enabled: true,
      cadence: formData.cadence,
      customIntervalMinutes:
        formData.cadence === 'custom' ? formData.customIntervalMinutes : undefined,
      exportConfig,
      deliveryConfig: {
        method: formData.deliveryMethod,
        email: formData.deliveryMethod === 'email' ? formData.email : undefined,
        webhookUrl: formData.deliveryMethod === 'webhook' ? formData.webhookUrl : undefined,
      },
    };

    addSchedule(newSchedule);
    setShowAddForm(false);
    setFormData({
      name: '',
      cadence: 'daily',
      customIntervalMinutes: 60,
      preset: 'custom',
      format: 'csv',
      deliveryMethod: 'email',
      email: '',
      webhookUrl: '',
    });
  };

  const getCadenceLabel = (schedule: ExportSchedule) => {
    if (schedule.cadence === 'custom') {
      return `Every ${schedule.customIntervalMinutes} minutes`;
    }
    return schedule.cadence.charAt(0).toUpperCase() + schedule.cadence.slice(1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Export Schedules
                </h2>
                <p className="text-white/60 text-sm mt-1">Automate your trade exports</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {schedules.length === 0 && !showAddForm ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
                  <p className="text-white/60 text-lg mb-4">No scheduled exports yet</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors font-semibold flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Schedule
                  </button>
                </div>
              ) : (
                <>
                  {schedules.map(schedule => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{schedule.name}</h3>
                            <button
                              onClick={() => toggleSchedule(schedule.id)}
                              className="flex items-center gap-2 text-sm"
                            >
                              {schedule.enabled ? (
                                <>
                                  <ToggleRight className="w-6 h-6 text-green-400" />
                                  <span className="text-green-400">Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                                  <span className="text-gray-400">Inactive</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-white/60">
                              <Clock className="w-4 h-4" />
                              {getCadenceLabel(schedule)}
                            </div>

                            <div className="flex items-center gap-2 text-white/60">
                              {schedule.deliveryConfig.method === 'email' ? (
                                <>
                                  <Mail className="w-4 h-4" />
                                  {schedule.deliveryConfig.email}
                                </>
                              ) : (
                                <>
                                  <Webhook className="w-4 h-4" />
                                  Webhook
                                </>
                              )}
                            </div>

                            <div className="text-white/60">
                              Format: {schedule.exportConfig.format.toUpperCase()}
                            </div>

                            <div className="text-white/60">
                              Preset: {schedule.exportConfig.preset.replace('_', ' ')}
                            </div>
                          </div>

                          {schedule.lastRun && (
                            <div className="mt-2 text-xs text-white/40">
                              Last run: {format(new Date(schedule.lastRun), 'PPpp')}
                            </div>
                          )}

                          {schedule.nextRun && (
                            <div className="text-xs text-white/40">
                              Next run: {format(new Date(schedule.nextRun), 'PPpp')}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {!showAddForm && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full p-4 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-dashed border-purple-500/30 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Schedule
                    </button>
                  )}
                </>
              )}

              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/20"
                >
                  <h3 className="text-lg font-semibold mb-4">New Export Schedule</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Schedule Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                        placeholder="e.g., Daily Tax Report"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Frequency</label>
                        <select
                          value={formData.cadence}
                          onChange={e =>
                            setFormData({ ...formData, cadence: e.target.value as ScheduleCadence })
                          }
                          className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {formData.cadence === 'custom' && (
                        <div>
                          <label className="text-sm text-white/60 mb-2 block">
                            Interval (minutes)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.customIntervalMinutes}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                customIntervalMinutes: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Export Preset</label>
                        <select
                          value={formData.preset}
                          onChange={e =>
                            setFormData({ ...formData, preset: e.target.value as ExportPreset })
                          }
                          className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                        >
                          <option value="tax_report">Tax Report</option>
                          <option value="performance">Performance</option>
                          <option value="trade_journal">Trade Journal</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Format</label>
                        <select
                          value={formData.format}
                          onChange={e =>
                            setFormData({ ...formData, format: e.target.value as ExportFormat })
                          }
                          className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                        >
                          <option value="csv">CSV</option>
                          <option value="xlsx">XLSX</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-white/60 mb-2 block">Delivery Method</label>
                      <select
                        value={formData.deliveryMethod}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            deliveryMethod: e.target.value as DeliveryMethod,
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                      >
                        <option value="email">Email</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>

                    {formData.deliveryMethod === 'email' && (
                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Email Address</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    )}

                    {formData.deliveryMethod === 'webhook' && (
                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Webhook URL</label>
                        <input
                          type="url"
                          value={formData.webhookUrl}
                          onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                          placeholder="https://your-webhook-url.com"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-xl transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors font-semibold"
                    >
                      Create Schedule
                    </button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
