import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri');

describe('Chain Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list enabled chains', async () => {
    const mockChains = [
      { chain_id: 'solana', rpc_url: 'https://api.mainnet-beta.solana.com', native_token: 'SOL', enabled: true },
      { chain_id: 'ethereum', rpc_url: 'https://eth.llamarpc.com', native_token: 'ETH', enabled: true },
    ];

    vi.mocked(invoke).mockResolvedValue(mockChains);

    const result = await invoke('chain_list_enabled');
    expect(result).toEqual(mockChains);
    expect(invoke).toHaveBeenCalledWith('chain_list_enabled');
  });

  it('should get active chain', async () => {
    vi.mocked(invoke).mockResolvedValue('solana');

    const result = await invoke('chain_get_active');
    expect(result).toBe('solana');
  });

  it('should set active chain', async () => {
    vi.mocked(invoke).mockResolvedValue('ethereum');

    const result = await invoke('chain_set_active', { chain_id: 'ethereum' });
    expect(result).toBe('ethereum');
    expect(invoke).toHaveBeenCalledWith('chain_set_active', { chain_id: 'ethereum' });
  });
});

describe('Bridge Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get bridge quotes', async () => {
    const mockQuotes = [
      {
        provider: 'wormhole',
        from_chain: 'solana',
        to_chain: 'ethereum',
        amount_in: 100,
        amount_out: 99.8,
        estimated_time_seconds: 300,
        fee_amount: 0.2,
        fee_currency: 'USD',
        route_info: 'Wormhole Bridge: solana -> ethereum',
      },
    ];

    vi.mocked(invoke).mockResolvedValue(mockQuotes);

    const request = {
      from_chain: 'solana',
      to_chain: 'ethereum',
      token_address: 'test_token',
      amount: 100,
      recipient_address: 'recipient_addr',
    };

    const result = await invoke('bridge_get_quote', { request });
    expect(result).toEqual(mockQuotes);
  });

  it('should create bridge transaction', async () => {
    const mockTransaction = {
      id: 'tx_123',
      provider: 'wormhole',
      from_chain: 'solana',
      to_chain: 'ethereum',
      status: 'pending',
    };

    vi.mocked(invoke).mockResolvedValue(mockTransaction);

    const request = {
      provider: 'wormhole',
      from_chain: 'solana',
      to_chain: 'ethereum',
      token_address: 'test_token',
      amount: 100,
      recipient_address: 'recipient_addr',
      sender_address: 'sender_addr',
    };

    const result = await invoke('bridge_create_transaction', { request });
    expect(result).toEqual(mockTransaction);
  });

  it('should list bridge transactions', async () => {
    const mockTransactions = [
      {
        id: 'tx_1',
        provider: 'wormhole',
        status: 'completed',
      },
      {
        id: 'tx_2',
        provider: 'synapse',
        status: 'pending',
      },
    ];

    vi.mocked(invoke).mockResolvedValue(mockTransactions);

    const result = await invoke('bridge_list_transactions');
    expect(result).toEqual(mockTransactions);
  });
});

describe('Cross-Chain Portfolio', () => {
  it('should aggregate portfolio across chains', async () => {
    const mockSummary = {
      total_value_usd: 10000,
      per_chain: [
        {
          chain_id: 'solana',
          balances: {
            native_balance: 10,
            total_usd_value: 5000,
            tokens: [],
          },
        },
        {
          chain_id: 'ethereum',
          balances: {
            native_balance: 1.5,
            total_usd_value: 5000,
            tokens: [],
          },
        },
      ],
      per_wallet: [],
    };

    vi.mocked(invoke).mockResolvedValue(mockSummary);

    const walletMap = {
      solana: 'solana_wallet',
      ethereum: 'ethereum_wallet',
    };

    const result = await invoke('chain_get_cross_chain_portfolio', { wallet_addresses: walletMap });
    expect(result).toEqual(mockSummary);
    expect(result.total_value_usd).toBe(10000);
    expect(result.per_chain.length).toBe(2);
  });
});
