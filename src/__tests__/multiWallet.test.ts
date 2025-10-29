import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWalletStore } from '../store/walletStore';
import type {
  WalletInfo,
  WalletGroup,
  AddWalletRequest,
  CreateGroupRequest,
} from '../store/walletStore';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Multi-Wallet Store', () => {
  beforeEach(() => {
    useWalletStore.setState({
      wallets: [],
      groups: [],
      activeWalletId: null,
      aggregatedPortfolio: null,
      multiWalletLoading: false,
      multiWalletError: null,
    });
    vi.clearAllMocks();
  });

  describe('Wallet Management', () => {
    it('should add a new wallet', async () => {
      const mockWallet: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'TestPublicKey123',
        label: 'Test Wallet',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 0,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: false,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockWallet);
      vi.mocked(invoke).mockResolvedValueOnce({
        totalBalance: 0,
        totalWallets: 1,
        totalGroups: 0,
        totalTrades: 0,
        totalVolume: 0,
        totalRealizedPnl: 0,
        totalUnrealizedPnl: 0,
        wallets: [mockWallet],
      });

      const request: AddWalletRequest = {
        publicKey: 'TestPublicKey123',
        label: 'Test Wallet',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
      };

      await useWalletStore.getState().addWallet(request);

      const state = useWalletStore.getState();
      expect(state.wallets).toHaveLength(1);
      expect(state.wallets[0].label).toBe('Test Wallet');
      expect(state.activeWalletId).toBe('wallet_1');
    });

    it('should set active wallet', async () => {
      const mockWallet1: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'Key1',
        label: 'Wallet 1',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 10,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: false,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      useWalletStore.setState({
        wallets: [mockWallet1],
        activeWalletId: 'wallet_1',
      });

      const mockWallet2 = { ...mockWallet1, id: 'wallet_2', label: 'Wallet 2', publicKey: 'Key2' };

      vi.mocked(invoke).mockResolvedValueOnce(mockWallet2);

      await useWalletStore.getState().setActiveWallet('wallet_2');

      const state = useWalletStore.getState();
      expect(state.activeWalletId).toBe('wallet_2');
      expect(state.publicKey).toBe('Key2');
    });

    it('should remove a wallet', async () => {
      const mockWallet: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'Key1',
        label: 'Wallet 1',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 10,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: false,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      useWalletStore.setState({
        wallets: [mockWallet],
        activeWalletId: 'wallet_1',
      });

      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      vi.mocked(invoke).mockResolvedValueOnce({
        totalBalance: 0,
        totalWallets: 0,
        totalGroups: 0,
        totalTrades: 0,
        totalVolume: 0,
        totalRealizedPnl: 0,
        totalUnrealizedPnl: 0,
        wallets: [],
      });

      await useWalletStore.getState().removeWallet('wallet_1');

      const state = useWalletStore.getState();
      expect(state.wallets).toHaveLength(0);
      expect(state.activeWalletId).toBeNull();
    });

    it('should get active wallet', () => {
      const mockWallet: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'Key1',
        label: 'Wallet 1',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 10,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: false,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      useWalletStore.setState({
        wallets: [mockWallet],
        activeWalletId: 'wallet_1',
      });

      const activeWallet = useWalletStore.getState().getActiveWallet();
      expect(activeWallet).toBeDefined();
      expect(activeWallet?.id).toBe('wallet_1');
      expect(activeWallet?.label).toBe('Wallet 1');
    });
  });

  describe('Group Management', () => {
    it('should create a wallet group', async () => {
      const mockWallet: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'Key1',
        label: 'Wallet 1',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 10,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: false,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      const mockGroup: WalletGroup = {
        id: 'group_1',
        name: 'Trading Group',
        description: 'Main trading wallets',
        createdAt: new Date().toISOString(),
        walletIds: ['wallet_1'],
        sharedSettings: {
          maxSlippage: 1.5,
          defaultPriorityFee: 5000,
          riskLevel: 'balanced',
          autoRebalance: true,
        },
      };

      useWalletStore.setState({
        wallets: [mockWallet],
      });

      vi.mocked(invoke).mockResolvedValueOnce(mockGroup);
      vi.mocked(invoke).mockResolvedValueOnce([{ ...mockWallet, groupId: 'group_1' }]);
      vi.mocked(invoke).mockResolvedValueOnce(null);

      const request: CreateGroupRequest = {
        name: 'Trading Group',
        description: 'Main trading wallets',
        walletIds: ['wallet_1'],
        sharedSettings: {
          maxSlippage: 1.5,
          defaultPriorityFee: 5000,
          riskLevel: 'balanced',
          autoRebalance: true,
        },
      };

      await useWalletStore.getState().createGroup(request);

      const state = useWalletStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0].name).toBe('Trading Group');
      expect(state.groups[0].walletIds).toContain('wallet_1');
    });

    it('should delete a wallet group', async () => {
      const mockGroup: WalletGroup = {
        id: 'group_1',
        name: 'Trading Group',
        description: 'Main trading wallets',
        createdAt: new Date().toISOString(),
        walletIds: ['wallet_1'],
        sharedSettings: {
          maxSlippage: 1.5,
          defaultPriorityFee: 5000,
          riskLevel: 'balanced',
          autoRebalance: true,
        },
      };

      useWalletStore.setState({
        groups: [mockGroup],
      });

      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      vi.mocked(invoke).mockResolvedValueOnce([]);
      vi.mocked(invoke).mockResolvedValueOnce(null);

      await useWalletStore.getState().deleteGroup('group_1');

      const state = useWalletStore.getState();
      expect(state.groups).toHaveLength(0);
    });
  });

  describe('Wallet Preferences', () => {
    it('should respect trading isolation mode', () => {
      const mockWallet: WalletInfo = {
        id: 'wallet_1',
        publicKey: 'Key1',
        label: 'Isolated Wallet',
        network: 'devnet',
        walletType: 'phantom',
        groupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: null,
        balance: 10,
        preferences: {
          tradingEnabled: true,
          autoApproveLimit: null,
          maxSlippage: null,
          defaultPriorityFee: null,
          notificationsEnabled: true,
          isolationMode: true,
        },
        performance: {
          totalTrades: 0,
          successfulTrades: 0,
          totalVolume: 0,
          realizedPnl: 0,
          unrealizedPnl: 0,
          lastUpdated: null,
        },
      };

      useWalletStore.setState({
        wallets: [mockWallet],
        activeWalletId: 'wallet_1',
      });

      const activeWallet = useWalletStore.getState().getActiveWallet();
      expect(activeWallet?.preferences.isolationMode).toBe(true);
      expect(activeWallet?.preferences.tradingEnabled).toBe(true);
    });
  });

  describe('Aggregated Portfolio', () => {
    it('should get aggregated portfolio stats', async () => {
      const mockPortfolio = {
        totalBalance: 25.5,
        totalWallets: 2,
        totalGroups: 1,
        totalTrades: 50,
        totalVolume: 100.5,
        totalRealizedPnl: 5.25,
        totalUnrealizedPnl: 2.75,
        wallets: [],
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockPortfolio);

      await useWalletStore.getState().getAggregatedPortfolio();

      const state = useWalletStore.getState();
      expect(state.aggregatedPortfolio).toBeDefined();
      expect(state.aggregatedPortfolio?.totalBalance).toBe(25.5);
      expect(state.aggregatedPortfolio?.totalWallets).toBe(2);
      expect(state.aggregatedPortfolio?.totalRealizedPnl).toBe(5.25);
    });
  });
});
