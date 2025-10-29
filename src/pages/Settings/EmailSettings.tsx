import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  CheckCircle,
  AlertTriangle,
  Server,
  Lock,
  Eye,
  EyeOff,
  FilePlus,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useEmailStore, EmailAttachment } from '../../store/emailStore';

const providerPresets = {
  gmail: { server: 'smtp.gmail.com', port: 587, useTls: false, useStarttls: true },
  outlook: { server: 'smtp-mail.outlook.com', port: 587, useTls: false, useStarttls: true },
  sendgrid: { server: 'smtp.sendgrid.net', port: 587, useTls: false, useStarttls: true },
  custom: { server: '', port: 587, useTls: false, useStarttls: true },
};

const ALERT_TEMPLATE_HTML = `
  <html>
  <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 24px;">
    <div style="max-width: 520px; margin: 0 auto; background-color: #111827; border-radius: 18px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.2);">
      <div style="padding: 24px; background: linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(59, 130, 246, 0.4));">
        <h2 style="margin: 0; color: #f8fafc;">Price Alert Triggered</h2>
        <p style="margin: 8px 0 0; color: rgba(248, 250, 252, 0.8);">Your alert for <strong>{{symbol}}</strong> has been activated.</p>
      </div>
      <div style="padding: 24px;">
        <p><strong>Symbol:</strong> {{symbol}}</p>
        <p><strong>Current Price:</strong> {{price}}</p>
        <p><strong>Condition:</strong> {{condition}}</p>
        <p><strong>Triggered At:</strong> {{timestamp}}</p>
        <div style="margin-top: 24px; padding: 16px; background-color: rgba(59, 130, 246, 0.08); border-radius: 12px;">
          <p style="margin: 0 0 8px; font-weight: 600;">What happened?</p>
          <p style="margin: 0; color: rgba(226, 232, 240, 0.8);">We detected that your alert conditions were met. Review your positions and decide if action is needed.</p>
        </div>
      </div>
      <div style="padding: 16px 24px; background-color: #0f172a; font-size: 12px; color: rgba(148, 163, 184, 0.8);">
        <p style="margin: 0;">Eclipse Market Pro &bull; Trade smarter with real-time intelligence</p>
        <p style="margin: 8px 0 0;">
          <a href="{{unsubscribe_url}}" style="color: rgba(168, 85, 247, 0.8);">Unsubscribe</a> from these notifications or manage preferences in Settings.
        </p>
      </div>
    </div>
  </body>
  </html>
`;

const ALERT_TEMPLATE_TEXT = `Price Alert Triggered\n\nSymbol: {{symbol}}\nCurrent Price: {{price}}\nCondition: {{condition}}\nTriggered At: {{timestamp}}\n\nYou can adjust alert preferences in Settings or unsubscribe here: {{unsubscribe_url}}`;

type TemplateOption = 'alert' | 'custom';

type AttachmentPreview = EmailAttachment & { size: number };

const defaultVars = {
  symbol: 'SOL',
  price: '$182.14',
  condition: 'Price crossed above $180',
  timestamp: new Date().toLocaleString(),
  unsubscribe_url: 'https://app.eclipse.market/unsubscribe',
};

const renderTemplate = (template: string, vars: Record<string, unknown>) =>
  template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const value = vars[key.trim()];
    return value === undefined || value === null ? '' : String(value);
  });

const EmailSettings = () => {
  const {
    config,
    stats,
    history,
    isLoading,
    error,
    testConnectionResult,
    saveConfig,
    getConfig,
    deleteConfig,
    testConnection,
    getStats,
    getHistory,
    sendEmail,
  } = useEmailStore();

  const [provider, setProvider] = useState<keyof typeof providerPresets>('custom');
  const [server, setServer] = useState('');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [fromName, setFromName] = useState('');
  const [useTls, setUseTls] = useState(false);
  const [useStarttls, setUseStarttls] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>('alert');
  const [customSubject, setCustomSubject] = useState('Weekly Portfolio Snapshot');
  const [customHtml, setCustomHtml] = useState('<p>Your latest portfolio analytics are ready.</p>');
  const [customText, setCustomText] = useState('Your latest portfolio analytics are ready.');
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(true);
  const [templateVarsInput, setTemplateVarsInput] = useState(
    JSON.stringify(defaultVars, null, 2)
  );
  const [templateVarsError, setTemplateVarsError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    getConfig();
    getStats();
    getHistory(20);
  }, []);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setServer(config.server);
      setPort(config.port);
      setUsername(config.username);
      setPassword(config.password);
      setFromAddress(config.fromAddress);
      setFromName(config.fromName);
      setUseTls(config.useTls);
      setUseStarttls(config.useStarttls);
    }
  }, [config]);

  const parsedTemplateVars = useMemo(() => {
    try {
      const parsed = JSON.parse(templateVarsInput || '{}');
      setTemplateVarsError(null);
      return parsed as Record<string, unknown>;
    } catch (err) {
      setTemplateVarsError('Invalid JSON for template variables');
      return defaultVars;
    }
  }, [templateVarsInput]);

  const previewHtml = useMemo(() => {
    if (selectedTemplate === 'alert') {
      return renderTemplate(ALERT_TEMPLATE_HTML, parsedTemplateVars);
    }
    return includeUnsubscribe
      ? `${customHtml}\n<br /><hr /><p style="font-size:12px;color:#64748b;">Unsubscribe link will be appended automatically.</p>`
      : customHtml;
  }, [selectedTemplate, parsedTemplateVars, customHtml, includeUnsubscribe]);

  const previewText = useMemo(() => {
    if (selectedTemplate === 'alert') {
      return renderTemplate(ALERT_TEMPLATE_TEXT, parsedTemplateVars);
    }
    return includeUnsubscribe
      ? `${customText}\n\nUnsubscribe link will be appended automatically.`
      : customText;
  }, [selectedTemplate, parsedTemplateVars, customText, includeUnsubscribe]);

  const handleProviderChange = (newProvider: keyof typeof providerPresets) => {
    setProvider(newProvider);
    const preset = providerPresets[newProvider];
    setServer(preset.server);
    setPort(preset.port);
    setUseTls(preset.useTls);
    setUseStarttls(preset.useStarttls);
  };

  const handleSave = async () => {
    try {
      await saveConfig({
        server,
        port,
        username,
        password,
        fromAddress,
        fromName,
        useTls,
        useStarttls,
        provider,
      });
      alert('SMTP configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleTest = async () => {
    await testConnection({
      server,
      port,
      username,
      password,
      fromAddress,
      fromName,
      useTls,
      useStarttls,
      provider,
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Delete the SMTP configuration?')) {
      try {
        await deleteConfig();
        setServer('');
        setPort(587);
        setUsername('');
        setPassword('');
        setFromAddress('');
        setFromName('');
      } catch (err) {
        console.error('Failed to delete config:', err);
      }
    }
  };

  const handleAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const buffers = await Promise.all(
      Array.from(files).map(async file => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Array.from(new Uint8Array(arrayBuffer));
        return {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          content: buffer,
          size: file.size,
        } satisfies AttachmentPreview;
      })
    );

    setAttachments(prev => [...prev, ...buffers]);
    event.target.value = '';
  };

  const removeAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.filename !== filename));
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      alert('Enter an email address to send the test email to.');
      return;
    }

    if (templateVarsError) {
      alert('Fix template variables JSON before sending.');
      return;
    }

    const subject =
      selectedTemplate === 'alert'
        ? `Price Alert Triggered: ${parsedTemplateVars.symbol ?? ''}`
        : customSubject || 'Custom Notification';

    setIsSendingTest(true);
    try {
      await sendEmail({
        to: [testEmail.trim()],
        subject,
        template: selectedTemplate === 'alert' ? 'alert' : undefined,
        templateVars: selectedTemplate === 'alert' ? parsedTemplateVars : undefined,
        htmlBody: selectedTemplate === 'custom' ? customHtml : undefined,
        textBody: selectedTemplate === 'custom' ? customText : undefined,
        attachments: attachments.map(({ filename, mimeType, content }) => ({
          filename,
          mimeType,
          content,
        })),
        includeUnsubscribe,
      });
      alert('Test email sent! Check your inbox.');
    } catch (err) {
      console.error('Failed to send test email:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Email Settings</h2>
        <p className="text-slate-400">
          Configure SMTP alerts, preview templates, and monitor delivery performance.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Emails Sent</p>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.totalSent}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24h: {stats.last24hSent}</p>
          </motion.div>

          <motion.div
            className="bg-slate-800/60 border border-red-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Failed</p>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.totalFailed}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24h: {stats.last24hFailed}</p>
          </motion.div>

          <motion.div
            className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Avg Delivery</p>
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.averageDeliveryTimeMs.toFixed(0)}ms</p>
          </motion.div>
        </div>
      )}

      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold">SMTP Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Provider Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(providerPresets).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p as keyof typeof providerPresets)}
                  className={`px-4 py-2 rounded-xl border transition capitalize ${
                    provider === p
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SMTP Server</label>
              <input
                type="text"
                value={server}
                onChange={e => setServer(e.target.value)}
                placeholder="smtp.example.com"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Port</label>
              <input
                type="number"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 pr-12 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Address</label>
              <input
                type="email"
                value={fromAddress}
                onChange={e => setFromAddress(e.target.value)}
                placeholder="noreply@example.com"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Name</label>
              <input
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Eclipse Market Pro"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useTls}
                onChange={e => setUseTls(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Use TLS</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useStarttls}
                onChange={e => setUseStarttls(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Use STARTTLS</span>
            </label>
          </div>

          {testConnectionResult && (
            <div
              className={`p-4 rounded-xl ${
                testConnectionResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  testConnectionResult.success ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {testConnectionResult.success
                  ? `Connection successful! Latency: ${testConnectionResult.latency}ms`
                  : `Connection failed: ${testConnectionResult.error}`}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={isLoading || !server || !username || !password}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !server || !username || !password}
              className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 transition"
            >
              Save Configuration
            </button>
            {config && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition"
              >
                Delete
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      </motion.div>

      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold">Template Preview & Test</h3>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <div className="flex gap-2">
                {(['alert', 'custom'] as TemplateOption[]).map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedTemplate(option)}
                    className={`px-4 py-2 rounded-xl border transition capitalize ${
                      selectedTemplate === option
                        ? 'bg-purple-500 text-white border-purple-400'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {selectedTemplate === 'custom' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">HTML Body</label>
                  <textarea
                    value={customHtml}
                    onChange={e => setCustomHtml(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plain Text Fallback</label>
                  <textarea
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Template Variables</label>
              <textarea
                value={templateVarsInput}
                onChange={e => setTemplateVarsInput(e.target.value)}
                rows={selectedTemplate === 'alert' ? 6 : 4}
                className={`w-full px-4 py-2 bg-slate-900/50 border rounded-xl text-white focus:outline-none ${
                  templateVarsError ? 'border-red-500/40 focus:border-red-500/60' : 'border-purple-500/20 focus:border-purple-500/50'
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">
                Provide JSON for template variables. Keys will replace <code>{'{{variable}}'}</code> tokens.
              </p>
              {templateVarsError && <p className="text-sm text-red-400 mt-1">{templateVarsError}</p>}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Attachments</label>
              <label className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-dashed border-purple-500/40 rounded-xl cursor-pointer hover:border-purple-500/60 transition">
                <input type="file" multiple className="hidden" onChange={handleAttachmentChange} />
                <FilePlus className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-300">Upload files to include with emails</span>
              </label>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map(file => (
                    <div
                      key={file.filename}
                      className="flex items-center justify-between px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700"
                    >
                      <div>
                        <p className="text-sm font-medium">{file.filename}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => removeAttachment(file.filename)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUnsubscribe}
                onChange={e => setIncludeUnsubscribe(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Append unsubscribe footer automatically</span>
            </label>
          </div>

          <div className="lg:w-1/2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-sm font-semibold">HTML Preview</span>
              </div>
              <div className="p-4 bg-slate-950/60 text-sm text-slate-200 min-h-[240px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-sm font-semibold">Text Preview</span>
              </div>
              <pre className="p-4 bg-slate-950/60 text-xs text-slate-400 whitespace-pre-wrap break-words">
                {previewText}
              </pre>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Send Test Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {history.length > 0 && (
        <motion.div
          className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold mb-4">Recent Deliveries</h3>
          <div className="space-y-2">
            {history.slice(0, 12).map(record => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-medium">{record.subject}</p>
                  <p className="text-sm text-slate-400">To: {record.to.join(', ')}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      record.status === 'sent'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : record.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {record.status}
                  </span>
                  {record.deliveryTimeMs && (
                    <p className="text-xs text-slate-500 mt-1">{record.deliveryTimeMs}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EmailSettings;
