import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';

export interface SmtpConfig {
  server: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  useTls: boolean;
  useStarttls: boolean;
  provider: 'gmail' | 'outlook' | 'sendgrid' | 'custom';
}

export interface EmailDeliveryRecord {
  id: string;
  to: string[];
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  error: string | null;
  sentAt: string;
  retryCount: number;
  deliveryTimeMs: number | null;
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  totalPending: number;
  averageDeliveryTimeMs: number;
  last24hSent: number;
  last24hFailed: number;
}

export interface SendEmailRequest {
  to: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  template?: string;
  templateVars?: Record<string, unknown>;
  attachments?: EmailAttachment[];
  includeUnsubscribe: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: number[];
  mimeType: string;
}

interface EmailStore {
  config: SmtpConfig | null;
  stats: EmailStats | null;
  history: EmailDeliveryRecord[];
  isLoading: boolean;
  error: string | null;
  testConnectionResult: { success: boolean; latency?: number; error?: string } | null;

  saveConfig: (config: SmtpConfig) => Promise<void>;
  getConfig: () => Promise<void>;
  deleteConfig: () => Promise<void>;
  testConnection: (config: SmtpConfig) => Promise<void>;
  sendEmail: (req: SendEmailRequest) => Promise<void>;
  getStats: () => Promise<void>;
  getHistory: (limit: number) => Promise<void>;
}

export const useEmailStore = create<EmailStore>((set) => ({
  config: null,
  stats: null,
  history: [],
  isLoading: false,
  error: null,
  testConnectionResult: null,

  saveConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('email_save_config', { config });
      set({ config, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  getConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await invoke<SmtpConfig>('email_get_config');
      set({ config, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false, config: null });
    }
  },

  deleteConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      await invoke('email_delete_config');
      set({ config: null, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  testConnection: async (config) => {
    set({ isLoading: true, error: null, testConnectionResult: null });
    try {
      const latency = await invoke<number>('email_test_connection', { config });
      set({ 
        testConnectionResult: { success: true, latency },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        testConnectionResult: { success: false, error: String(error) },
        error: String(error),
        isLoading: false 
      });
    }
  },

  sendEmail: async (req) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('email_send', { req });
      set({ isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  getStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await invoke<EmailStats>('email_get_stats');
      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  getHistory: async (limit) => {
    set({ isLoading: true, error: null });
    try {
      const history = await invoke<EmailDeliveryRecord[]>('email_get_history', { limit });
      set({ history, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
}));
