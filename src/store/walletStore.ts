import { create } from 'zustand';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PhantomSession {
  publicKey: string;
  network: string;
  connected: boolean;
  lastConnected?: string | null;
  label?: string;
}

export type DeviceType = 'ledger' | 'trezor';

export interface HardwareWalletDevice {
  deviceId: string;
  deviceType: DeviceType;
  productName: string;
  manufacturer: string;
  connected: boolean;
  firmwareVersion?: string | null;
  address?: string | null;
}

export type SigningMethod = 'software' | 'hardware';

export type WalletType = 'phantom' | 'hardware_ledger' | 'hardware_trezor' | 'imported';

export interface WalletPreferences {
  tradingEnabled: boolean;
  autoApproveLimit?: number | null;
  maxSlippage?: number | null;
  defaultPriorityFee?: number | null;
  notificationsEnabled: boolean;
  isolationMode: boolean;
}

export interface PerformanceMetrics {
  totalTrades: number;
  successfulTrades: number;
  totalVolume: number;
  realizedPnl: number;
  unrealizedPnl: number;
  lastUpdated?: string | null;
}

export interface WalletInfo {
  id: string;
  publicKey: string;
  label: string;
  network: string;
  chainId: string;
  walletType: WalletType;
  groupId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string | null;
  balance: number;
  preferences: WalletPreferences;
  performance: PerformanceMetrics;
}

export interface GroupSettings {
  maxSlippage?: number | null;
  defaultPriorityFee?: number | null;
  riskLevel?: string | null;
  autoRebalance: boolean;
}

export interface WalletGroup {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  walletIds: string[];
  sharedSettings: GroupSettings;
}

export interface AggregatedPortfolio {
  totalBalance: number;
  totalWallets: number;
  totalGroups: number;
  totalTrades: number;
  totalVolume: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  wallets: WalletInfo[];
}

export interface MultisigWallet {
  id: string;
  name: string;
  address: string;
  threshold: number;
  members: string[];
  createdAt: string;
  balance: number;
}

export interface MultisigProposal {
  id: string;
  walletId: string;
  transactionData: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
  createdBy: string;
  createdAt: string;
  description?: string;
  signatures: ProposalSignature[];
  executedAt?: string;
  txSignature?: string;
}

export interface ProposalSignature {
  id: string;
  proposalId: string;
  signer: string;
  signature: string;
  signedAt: string;
}

export interface CreateMultisigRequest {
  name: string;
  members: string[];
  threshold: number;
}

export interface CreateMultisigProposalRequest {
  walletId: string;
  transactionData: string;
  description?: string | null;
  createdBy: string;
}

export interface SignMultisigProposalRequest {
  proposalId: string;
  signer: string;
  signature: string;
}

export interface AddWalletRequest {
  publicKey: string;
  label: string;
  network: string;
  walletType: WalletType;
  groupId?: string | null;
  chainId?: string;
}

export interface UpdateWalletRequest {
  walletId: string;
  label?: string;
  groupId?: string | null;
  preferences?: WalletPreferences;
  chainId?: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string | null;
  walletIds: string[];
  sharedSettings?: GroupSettings;
}

export interface UpdateGroupRequest {
  groupId: string;
  name?: string;
  description?: string | null;
  walletIds?: string[];
  sharedSettings?: GroupSettings;
}

interface WalletStoreState {
  status: WalletStatus;
  publicKey: string | null;
  balance: number;
  network: WalletAdapterNetwork;
  endpoint: string | null;
  error: string | null;
  autoReconnect: boolean;
  attemptedAutoConnect: boolean;
  lastConnected: string | null;
  session: PhantomSession | null;
  hardwareDevices: HardwareWalletDevice[];
  activeHardwareDevice: HardwareWalletDevice | null;
  signingMethod: SigningMethod;
  defaultDerivationPath: string;

  wallets: WalletInfo[];
  groups: WalletGroup[];
  activeWalletId: string | null;
  aggregatedPortfolio: AggregatedPortfolio | null;
  multiWalletLoading: boolean;
  multiWalletError: string | null;

  multisigWallets: MultisigWallet[];
  activeMultisigWalletId: string | null;
  multisigProposals: MultisigProposal[];
  multisigLoading: boolean;
  multisigError: string | null;
  proposalNotifications: ProposalNotificationItem[];

  setStatus: (status: WalletStatus) => void;
  setPublicKey: (publicKey: string | null) => void;
  setBalance: (balance: number) => void;
  setError: (error: string | null) => void;
  setNetwork: (network: WalletAdapterNetwork) => void;
  setEndpoint: (endpoint: string | null) => void;
  setAutoReconnect: (autoReconnect: boolean) => void;
  setAttemptedAutoConnect: (attempted: boolean) => void;
  setLastConnected: (timestamp: string | null) => void;
  setSession: (session: PhantomSession | null) => void;
  setHardwareDevices: (devices: HardwareWalletDevice[]) => void;
  setActiveHardwareDevice: (device: HardwareWalletDevice | null) => void;
  setSigningMethod: (method: SigningMethod) => void;
  setDefaultDerivationPath: (path: string) => void;

  addWallet: (request: AddWalletRequest) => Promise<WalletInfo>;
  updateWallet: (request: UpdateWalletRequest) => Promise<WalletInfo>;
  removeWallet: (walletId: string) => Promise<void>;
  setActiveWallet: (walletId: string) => Promise<WalletInfo>;
  getActiveWallet: () => WalletInfo | null;
  listWallets: () => Promise<void>;
  updateWalletBalance: (walletId: string, balance: number) => Promise<void>;
  updatePerformanceMetrics: (walletId: string, metrics: PerformanceMetrics) => Promise<void>;

  createGroup: (request: CreateGroupRequest) => Promise<WalletGroup>;
  updateGroup: (request: UpdateGroupRequest) => Promise<WalletGroup>;
  deleteGroup: (groupId: string) => Promise<void>;
  listGroups: () => Promise<void>;

  getAggregatedPortfolio: () => Promise<AggregatedPortfolio>;
  refreshMultiWallet: () => Promise<void>;
  setMultiWalletError: (error: string | null) => void;

  listMultisigWallets: () => Promise<void>;
  getMultisigWallet: (walletId: string) => Promise<MultisigWallet | null>;
  createMultisigWallet: (request: CreateMultisigRequest) => Promise<MultisigWallet>;
  setActiveMultisigWallet: (walletId: string | null) => void;
  listProposals: (walletId: string, statusFilter?: string | null) => Promise<void>;
  createMultisigProposal: (request: CreateMultisigProposalRequest) => Promise<void>;
  signMultisigProposal: (request: SignMultisigProposalRequest) => Promise<void>;
  executeMultisigProposal: (proposalId: string) => Promise<string>;
  cancelMultisigProposal: (proposalId: string, userAddress: string) => Promise<void>;
  addProposalNotification: (notification: ProposalNotificationItem) => void;
  dismissProposalNotification: (id: string) => void;
  setMultisigError: (error: string | null) => void;

  reset: () => void;
}

export interface ProposalNotificationItem {
  id: string;
  walletName: string;
  proposalDescription?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
}

const memoryStorage = (): StateStorage => {
  const store = new Map<string, string | null>();

  return {
    getItem: name => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: name => {
      store.delete(name);
    },
  };
};

const getEnv = () => (typeof import.meta !== 'undefined' ? import.meta.env : undefined);

const normalizeNetwork = (value?: string): WalletAdapterNetwork => {
  const normalized = value?.toLowerCase();
  switch (normalized) {
    case 'mainnet-beta':
    case 'mainnet':
      return WalletAdapterNetwork.Mainnet;
    case 'testnet':
      return WalletAdapterNetwork.Testnet;
    case 'devnet':
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

const env = getEnv();
const defaultNetwork = normalizeNetwork(env?.VITE_SOLANA_NETWORK);
const defaultEndpoint = env?.VITE_SOLANA_RPC_ENDPOINT ?? null;

const updateActiveWalletState = (state: WalletStoreState, wallet: WalletInfo | null) => ({
  publicKey: wallet?.publicKey ?? state.publicKey,
  balance: wallet?.balance ?? state.balance,
});

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set, get) => ({
      status: 'disconnected',
      publicKey: null,
      balance: 0,
      network: defaultNetwork,
      endpoint: defaultEndpoint,
      error: null,
      autoReconnect: true,
      attemptedAutoConnect: false,
      lastConnected: null,
      session: null,
      hardwareDevices: [],
      activeHardwareDevice: null,
      signingMethod: 'software',
      defaultDerivationPath: "m/44'/501'/0'/0'",

      wallets: [],
      groups: [],
      activeWalletId: null,
      aggregatedPortfolio: null,
      multiWalletLoading: false,
      multiWalletError: null,

      multisigWallets: [],
      activeMultisigWalletId: null,
      multisigProposals: [],
      multisigLoading: false,
      multisigError: null,
      proposalNotifications: [],

      setStatus: status => set({ status }),
      setPublicKey: publicKey =>
        set(state => ({
          publicKey,
          activeWalletId: publicKey
            ? (state.wallets.find(wallet => wallet.publicKey === publicKey)?.id ??
              state.activeWalletId)
            : state.activeWalletId,
        })),
      setBalance: balance =>
        set(state => ({
          balance,
          wallets: state.activeWalletId
            ? state.wallets.map(wallet =>
                wallet.id === state.activeWalletId ? { ...wallet, balance } : wallet
              )
            : state.wallets,
        })),
      setError: error => set({ error }),
      setNetwork: network => set({ network }),
      setEndpoint: endpoint => set({ endpoint }),
      setAutoReconnect: autoReconnect => set({ autoReconnect }),
      setAttemptedAutoConnect: attempted => set({ attemptedAutoConnect: attempted }),
      setLastConnected: timestamp => set({ lastConnected: timestamp }),
      setSession: session => set({ session }),
      setHardwareDevices: devices => set({ hardwareDevices: devices }),
      setActiveHardwareDevice: device => set({ activeHardwareDevice: device }),
      setSigningMethod: method => set({ signingMethod: method }),
      setDefaultDerivationPath: path => set({ defaultDerivationPath: path }),

      addWallet: async (request: AddWalletRequest) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const wallet = await invoke<WalletInfo>('multi_wallet_add', { request });
          const wallets = [...get().wallets, wallet];
          set({
            wallets,
            activeWalletId: wallet.id,
            ...updateActiveWalletState(get(), wallet),
            multiWalletLoading: false,
          });
          await get().getAggregatedPortfolio();
          return wallet;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      updateWallet: async (request: UpdateWalletRequest) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const updatedWallet = await invoke<WalletInfo>('multi_wallet_update', { request });
          const wallets = get().wallets.map(wallet =>
            wallet.id === updatedWallet.id ? updatedWallet : wallet
          );
          set({
            wallets,
            ...(get().activeWalletId === updatedWallet.id
              ? updateActiveWalletState(get(), updatedWallet)
              : {}),
            multiWalletLoading: false,
          });
          await get().getAggregatedPortfolio();
          return updatedWallet;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      removeWallet: async (walletId: string) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          await invoke('multi_wallet_remove', { walletId });
          const wallets = get().wallets.filter(wallet => wallet.id !== walletId);
          const nextActiveWalletId =
            get().activeWalletId === walletId ? (wallets[0]?.id ?? null) : get().activeWalletId;
          const nextActiveWallet = wallets.find(wallet => wallet.id === nextActiveWalletId) ?? null;
          set({
            wallets,
            activeWalletId: nextActiveWalletId,
            ...updateActiveWalletState(get(), nextActiveWallet),
            multiWalletLoading: false,
          });
          await get().getAggregatedPortfolio();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      setActiveWallet: async (walletId: string) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const wallet = await invoke<WalletInfo>('multi_wallet_set_active', { walletId });
          const wallets = get().wallets.map(w => (w.id === wallet.id ? wallet : w));
          set({
            wallets,
            activeWalletId: wallet.id,
            ...updateActiveWalletState(get(), wallet),
            multiWalletLoading: false,
          });
          return wallet;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      getActiveWallet: () => {
        const { wallets, activeWalletId } = get();
        if (!activeWalletId) return null;
        return wallets.find(wallet => wallet.id === activeWalletId) ?? null;
      },

      listWallets: async () => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const wallets = await invoke<WalletInfo[]>('multi_wallet_list');
          const activeWallet = await invoke<WalletInfo | null>('multi_wallet_get_active');
          const activeWalletId = activeWallet?.id ?? wallets[0]?.id ?? null;

          set({
            wallets,
            activeWalletId,
            ...updateActiveWalletState(
              get(),
              activeWallet ??
                (activeWalletId ? (wallets.find(w => w.id === activeWalletId) ?? null) : null)
            ),
            multiWalletLoading: false,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      updateWalletBalance: async (walletId: string, balance: number) => {
        try {
          await invoke('multi_wallet_update_balance', { walletId, balance });
          const wallets = get().wallets.map(wallet =>
            wallet.id === walletId ? { ...wallet, balance } : wallet
          );
          const activeWallet =
            walletId === get().activeWalletId
              ? (wallets.find(w => w.id === walletId) ?? null)
              : get().getActiveWallet();
          set({
            wallets,
            ...updateActiveWalletState(get(), activeWallet),
          });
          await get().getAggregatedPortfolio();
        } catch (error) {
          console.error('Failed to update wallet balance:', error);
        }
      },

      updatePerformanceMetrics: async (walletId: string, metrics: PerformanceMetrics) => {
        try {
          await invoke('multi_wallet_update_performance', { walletId, metrics });
          const wallets = get().wallets.map(wallet =>
            wallet.id === walletId ? { ...wallet, performance: metrics } : wallet
          );
          set({ wallets });
          await get().getAggregatedPortfolio();
        } catch (error) {
          console.error('Failed to update performance metrics:', error);
        }
      },

      createGroup: async (request: CreateGroupRequest) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const group = await invoke<WalletGroup>('multi_wallet_create_group', { request });
          const groups = [...get().groups, group];
          set({ groups, multiWalletLoading: false });
          await get().listWallets();
          return group;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      updateGroup: async (request: UpdateGroupRequest) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const updatedGroup = await invoke<WalletGroup>('multi_wallet_update_group', { request });
          const groups = get().groups.map(group =>
            group.id === updatedGroup.id ? updatedGroup : group
          );
          set({ groups, multiWalletLoading: false });
          await get().listWallets();
          return updatedGroup;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      deleteGroup: async (groupId: string) => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          await invoke('multi_wallet_delete_group', { groupId });
          const groups = get().groups.filter(group => group.id !== groupId);
          set({ groups, multiWalletLoading: false });
          await get().listWallets();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      listGroups: async () => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          const groups = await invoke<WalletGroup[]>('multi_wallet_list_groups');
          set({ groups, multiWalletLoading: false });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
          throw error;
        }
      },

      getAggregatedPortfolio: async () => {
        try {
          const aggregatedPortfolio = await invoke<AggregatedPortfolio>(
            'multi_wallet_get_aggregated'
          );
          set({ aggregatedPortfolio });
          return aggregatedPortfolio;
        } catch (error) {
          console.error('Failed to get aggregated portfolio:', error);
          throw error;
        }
      },

      refreshMultiWallet: async () => {
        set({ multiWalletLoading: true, multiWalletError: null });
        try {
          await Promise.all([
            get().listWallets(),
            get().listGroups(),
            get().getAggregatedPortfolio(),
          ]);
          set({ multiWalletLoading: false });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multiWalletError: errorMsg, multiWalletLoading: false });
        }
      },

      setMultiWalletError: multiWalletError => set({ multiWalletError }),

      listMultisigWallets: async () => {
        set({ multisigLoading: true, multisigError: null });
        try {
          const wallets = await invoke<MultisigWallet[]>('list_multisig_wallets');
          const currentActiveId = get().activeMultisigWalletId;
          const nextActiveId =
            currentActiveId && wallets.some(wallet => wallet.id === currentActiveId)
              ? currentActiveId
              : (wallets[0]?.id ?? null);

          set({
            multisigWallets: wallets,
            activeMultisigWalletId: nextActiveId,
            multisigLoading: false,
          });

          if (nextActiveId) {
            await get().listProposals(nextActiveId);
          } else {
            set({ multisigProposals: [] });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg, multisigLoading: false });
          throw error;
        }
      },

      getMultisigWallet: async walletId => {
        try {
          const wallet = await invoke<MultisigWallet | null>('get_multisig_wallet', { walletId });
          if (wallet) {
            set(state => ({
              multisigWallets: state.multisigWallets.some(w => w.id === wallet.id)
                ? state.multisigWallets.map(w => (w.id === wallet.id ? wallet : w))
                : [...state.multisigWallets, wallet],
            }));
          }
          return wallet;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg });
          throw error;
        }
      },

      createMultisigWallet: async request => {
        set({ multisigLoading: true, multisigError: null });
        try {
          const wallet = await invoke<MultisigWallet>('create_multisig_wallet', { request });
          set(state => ({
            multisigWallets: [...state.multisigWallets, wallet],
            activeMultisigWalletId: wallet.id,
            multisigLoading: false,
          }));
          await get().listProposals(wallet.id);
          return wallet;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg, multisigLoading: false });
          throw error;
        }
      },

      setActiveMultisigWallet: walletId => {
        set({ activeMultisigWalletId: walletId });
        if (walletId) {
          get()
            .listProposals(walletId)
            .catch(error => {
              console.error('Failed to load proposals for multisig wallet:', error);
            });
        } else {
          set({ multisigProposals: [] });
        }
      },

      listProposals: async (walletId, statusFilter = null) => {
        set({ multisigLoading: true, multisigError: null });
        try {
          const proposals = await invoke<MultisigProposal[]>('list_proposals', {
            walletId,
            statusFilter,
          });
          set({ multisigProposals: proposals, multisigLoading: false });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg, multisigLoading: false });
          throw error;
        }
      },

      createMultisigProposal: async request => {
        set({ multisigLoading: true, multisigError: null });
        try {
          await invoke('create_proposal', { request });
          await get().listProposals(request.walletId);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg });
          throw error;
        } finally {
          set({ multisigLoading: false });
        }
      },

      signMultisigProposal: async request => {
        set({ multisigLoading: true, multisigError: null });
        try {
          await invoke('sign_proposal', { request });
          const walletId = get().activeMultisigWalletId;
          if (walletId) {
            await get().listProposals(walletId);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg });
          throw error;
        } finally {
          set({ multisigLoading: false });
        }
      },

      executeMultisigProposal: async proposalId => {
        set({ multisigLoading: true, multisigError: null });
        try {
          const signature = await invoke<string>('execute_proposal', { proposalId });
          const walletId = get().activeMultisigWalletId;
          if (walletId) {
            await get().listProposals(walletId);
          }
          return signature;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg });
          throw error;
        } finally {
          set({ multisigLoading: false });
        }
      },

      cancelMultisigProposal: async (proposalId, userAddress) => {
        set({ multisigLoading: true, multisigError: null });
        try {
          await invoke('cancel_proposal', { proposalId, userAddress });
          const walletId = get().activeMultisigWalletId;
          if (walletId) {
            await get().listProposals(walletId);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ multisigError: errorMsg });
          throw error;
        } finally {
          set({ multisigLoading: false });
        }
      },

      addProposalNotification: notification => {
        set(state => ({
          proposalNotifications: [notification, ...state.proposalNotifications].slice(0, 10),
        }));
      },

      dismissProposalNotification: id => {
        set(state => ({
          proposalNotifications: state.proposalNotifications.filter(
            notification => notification.id !== id
          ),
        }));
      },

      setMultisigError: multisigError => set({ multisigError }),

      reset: () =>
        set(state => ({
          status: 'disconnected',
          publicKey: null,
          balance: 0,
          error: null,
          session: null,
          lastConnected: null,
          hardwareDevices: [],
          activeHardwareDevice: null,
          signingMethod: 'software',
          // Preserve multi-wallet configuration when disconnecting a single session
          wallets: state.wallets,
          groups: state.groups,
          activeWalletId: state.activeWalletId,
          aggregatedPortfolio: state.aggregatedPortfolio,
          multisigWallets: state.multisigWallets,
          activeMultisigWalletId: state.activeMultisigWalletId,
          multisigProposals: state.multisigProposals,
          proposalNotifications: state.proposalNotifications,
        })),
    }),
    {
      name: 'phantom-wallet-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return memoryStorage();
        }
        return window.localStorage;
      }),
      partialize: state => ({
        publicKey: state.publicKey,
        network: state.network,
        endpoint: state.endpoint,
        autoReconnect: state.autoReconnect,
        lastConnected: state.lastConnected,
        session: state.session,
        hardwareDevices: state.hardwareDevices,
        activeHardwareDevice: state.activeHardwareDevice,
        signingMethod: state.signingMethod,
        defaultDerivationPath: state.defaultDerivationPath,
        activeWalletId: state.activeWalletId,
      }),
    }
  )
);
