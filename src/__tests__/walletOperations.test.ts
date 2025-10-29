import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  TokenBalance,
  TransactionFeeEstimate,
  SendTransactionInput,
  AddressBookContact,
  SwapHistoryEntry,
} from '../types/wallet';

vi.mock('@tauri-apps/api/tauri');

describe('Wallet Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Balances', () => {
    it('should fetch token balances', async () => {
      const mockBalances: TokenBalance[] = [
        {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          name: 'Solana',
          balance: 1.5,
          decimals: 9,
          usdValue: 150.0,
          change24h: 2.5,
          logoUri: 'https://example.com/sol.png',
          lastUpdated: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockBalances);

      const result = await invoke<TokenBalance[]>('wallet_get_token_balances', {
        address: 'test_address',
        forceRefresh: false,
      });

      expect(result).toEqual(mockBalances);
      expect(invoke).toHaveBeenCalledWith('wallet_get_token_balances', {
        address: 'test_address',
        forceRefresh: false,
      });
    });

    it('should force refresh token balances', async () => {
      vi.mocked(invoke).mockResolvedValue([]);

      await invoke('wallet_get_token_balances', {
        address: 'test_address',
        forceRefresh: true,
      });

      expect(invoke).toHaveBeenCalledWith('wallet_get_token_balances', {
        address: 'test_address',
        forceRefresh: true,
      });
    });
  });

  describe('Send Transaction', () => {
    it('should estimate transaction fee', async () => {
      const mockFee: TransactionFeeEstimate = {
        baseFee: 0.000005,
        priorityFee: 0.000001,
        totalFee: 0.000006,
        estimatedUnits: 200000,
      };

      vi.mocked(invoke).mockResolvedValue(mockFee);

      const result = await invoke<TransactionFeeEstimate>('wallet_estimate_fee', {
        recipient: 'recipient_address',
        amount: 1.0,
        tokenMint: null,
      });

      expect(result).toEqual(mockFee);
    });

    it('should send transaction', async () => {
      const mockSignature = 'tx_signature_123';
      const input: SendTransactionInput = {
        recipient: 'recipient_address',
        amount: 1.0,
        memo: 'test memo',
      };

      vi.mocked(invoke).mockResolvedValue(mockSignature);

      const result = await invoke<string>('wallet_send_transaction', {
        input,
        walletAddress: 'sender_address',
      });

      expect(result).toBe(mockSignature);
    });
  });

  describe('Address Book', () => {
    it('should add contact', async () => {
      const mockContact: AddressBookContact = {
        id: 'contact_123',
        address: 'contact_address',
        label: 'Test Contact',
        nickname: 'Test',
        notes: 'Notes here',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        lastUsed: undefined,
        transactionCount: 0,
        tags: ['friend'],
      };

      vi.mocked(invoke).mockResolvedValue(mockContact);

      const result = await invoke<AddressBookContact>('address_book_add_contact', {
        request: {
          address: 'contact_address',
          label: 'Test Contact',
          nickname: 'Test',
          notes: 'Notes here',
          tags: ['friend'],
        },
      });

      expect(result).toEqual(mockContact);
    });

    it('should list contacts', async () => {
      const mockContacts: AddressBookContact[] = [
        {
          id: 'contact_1',
          address: 'address1',
          label: 'Contact 1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          transactionCount: 0,
          tags: [],
        },
        {
          id: 'contact_2',
          address: 'address2',
          label: 'Contact 2',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          transactionCount: 5,
          tags: ['exchange'],
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockContacts);

      const result = await invoke<AddressBookContact[]>('address_book_list_contacts');

      expect(result).toEqual(mockContacts);
    });

    it('should search contacts', async () => {
      const mockResults: AddressBookContact[] = [
        {
          id: 'contact_1',
          address: 'address1',
          label: 'Alice',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          transactionCount: 0,
          tags: [],
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockResults);

      const result = await invoke<AddressBookContact[]>('address_book_search_contacts', {
        query: 'Alice',
      });

      expect(result).toEqual(mockResults);
    });

    it('should export contacts', async () => {
      const mockJson = '{"contacts":{}}';

      vi.mocked(invoke).mockResolvedValue(mockJson);

      const result = await invoke<string>('address_book_export');

      expect(typeof result).toBe('string');
    });

    it('should delete contact', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('address_book_delete_contact', { contactId: 'contact_123' });

      expect(invoke).toHaveBeenCalledWith('address_book_delete_contact', {
        contactId: 'contact_123',
      });
    });
  });

  describe('Swap History', () => {
    it('should add swap entry', async () => {
      const entry: SwapHistoryEntry = {
        id: 'swap_123',
        fromToken: 'SOL',
        toToken: 'USDC',
        fromAmount: 1.0,
        toAmount: 100.0,
        rate: 100.0,
        fee: 0.1,
        priceImpact: 0.5,
        timestamp: '2024-01-01T00:00:00Z',
        status: 'completed',
      };

      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('swap_history_add_entry', { entry });

      expect(invoke).toHaveBeenCalledWith('swap_history_add_entry', { entry });
    });

    it('should get recent swaps', async () => {
      const mockSwaps: SwapHistoryEntry[] = [
        {
          id: 'swap_1',
          fromToken: 'SOL',
          toToken: 'USDC',
          fromAmount: 1.0,
          toAmount: 100.0,
          rate: 100.0,
          fee: 0.1,
          priceImpact: 0.5,
          timestamp: '2024-01-01T00:00:00Z',
          status: 'completed',
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockSwaps);

      const result = await invoke<SwapHistoryEntry[]>('swap_history_get_recent', { limit: 10 });

      expect(result).toEqual(mockSwaps);
    });
  });

  describe('QR Code Generation', () => {
    it('should generate basic QR code', async () => {
      const mockQr = 'data:image/png;base64,mockdata';

      vi.mocked(invoke).mockResolvedValue(mockQr);

      const result = await invoke<string>('wallet_generate_qr', {
        data: {
          address: 'test_address',
          amount: 1.0,
        },
      });

      expect(typeof result).toBe('string');
    });

    it('should generate Solana Pay QR', async () => {
      const mockSolPayQr = {
        url: 'solana:address?amount=1',
        qr_data: 'data:image/png;base64,mockdata',
        recipient: 'test_address',
        amount: 1.0,
      };

      vi.mocked(invoke).mockResolvedValue(mockSolPayQr);

      const result = await invoke('wallet_generate_solana_pay_qr', {
        recipient: 'test_address',
        amount: 1.0,
      });

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('recipient');
    });
  });

  describe('Bridge Providers', () => {
    it('should get bridge providers', async () => {
      const mockProviders = [
        {
          id: 'wormhole',
          name: 'Wormhole',
          logo: 'https://wormhole.com/logo.png',
          supportedChains: ['ethereum', 'bsc'],
          fees: {
            percentage: 0.1,
            fixed: 0,
          },
          estimatedTime: '15-30 minutes',
        },
      ];

      vi.mocked(invoke).mockResolvedValue(mockProviders);

      const result = await invoke('wallet_get_bridge_providers');

      expect(result).toEqual(mockProviders);
    });
  });

  describe('Error Handling', () => {
    it('should handle balance fetch error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Network error'));

      await expect(
        invoke('wallet_get_token_balances', { address: 'test_address', forceRefresh: false })
      ).rejects.toThrow('Network error');
    });

    it('should handle send transaction error', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Insufficient balance'));

      await expect(
        invoke('wallet_send_transaction', {
          input: { recipient: 'test', amount: 100 },
          walletAddress: 'test',
        })
      ).rejects.toThrow('Insufficient balance');
    });
  });
});
