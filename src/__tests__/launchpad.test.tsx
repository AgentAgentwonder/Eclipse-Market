import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/tauri';
import TokenConfig from '../components/launchpad/TokenConfig';
import LaunchpadStudio from '../components/launchpad/LaunchpadStudio';

vi.mock('@tauri-apps/api/tauri');

describe('Launchpad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TokenConfig', () => {
    it('renders token configuration form', () => {
      const mockOnLaunchCreated = vi.fn();
      render(<TokenConfig onLaunchCreated={mockOnLaunchCreated} />);

      expect(screen.getByText(/Token Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Symbol/i)).toBeInTheDocument();
      expect(screen.getByText(/Decimals/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Supply/i)).toBeInTheDocument();
    });

    it('creates launch draft when form is submitted', async () => {
      const mockLaunchConfig = {
        id: 'test-launch-id',
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 9,
        totalSupply: 1000000,
        description: 'Test token description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };

      vi.mocked(invoke).mockResolvedValueOnce(mockLaunchConfig);

      const mockOnLaunchCreated = vi.fn();
      const { getByLabelText, getByText } = render(
        <TokenConfig onLaunchCreated={mockOnLaunchCreated} />
      );

      const nameInput = getByLabelText(/Token Name/i);
      const symbolInput = getByLabelText(/Symbol/i);
      const descInput = getByLabelText(/Description/i);

      fireEvent.change(nameInput, { target: { value: 'Test Token' } });
      fireEvent.change(symbolInput, { target: { value: 'TEST' } });
      fireEvent.change(descInput, { target: { value: 'Test description' } });

      const saveDraftButton = getByText(/Save Draft/i);
      fireEvent.click(saveDraftButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('create_launch_config', expect.objectContaining({
          name: 'Test Token',
          symbol: 'TEST',
        }));
        expect(mockOnLaunchCreated).toHaveBeenCalledWith('test-launch-id');
      });
    });

    it('simulates token creation and shows results', async () => {
      const mockSimulation = {
        success: true,
        computeUnits: 200000,
        feeEstimate: 5000,
        logs: ['Creating mint account...', 'Token created successfully'],
        warnings: ['Mint authority enabled'],
      };

      const mockSafetyCheck = {
        passed: true,
        securityScore: 85,
        riskLevel: 'low',
        checks: [
          {
            checkName: 'Token Supply',
            passed: true,
            severity: 'info',
            message: 'Token supply is within safe limits',
          },
        ],
        timestamp: new Date().toISOString(),
      };

      vi.mocked(invoke)
        .mockResolvedValueOnce(mockSimulation)
        .mockResolvedValueOnce(mockSafetyCheck);

      const mockOnLaunchCreated = vi.fn();
      const { getByText } = render(
        <TokenConfig onLaunchCreated={mockOnLaunchCreated} />
      );

      const simulateButton = getByText(/Simulate & Check Safety/i);
      fireEvent.click(simulateButton);

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('simulate_token_creation', expect.any(Object));
        expect(invoke).toHaveBeenCalledWith('check_launch_safety', expect.any(Object));
        expect(screen.getByText(/Simulation Result/i)).toBeInTheDocument();
        expect(screen.getByText(/Safety & Compliance/i)).toBeInTheDocument();
      });
    });
  });

  describe('LaunchpadStudio', () => {
    it('renders all launchpad tabs', () => {
      render(<LaunchpadStudio />);

      expect(screen.getByText(/Token Setup/i)).toBeInTheDocument();
      expect(screen.getByText(/Liquidity Lock/i)).toBeInTheDocument();
      expect(screen.getByText(/Vesting/i)).toBeInTheDocument();
      expect(screen.getByText(/Airdrop/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitor/i)).toBeInTheDocument();
    });

    it('switches between tabs', () => {
      render(<LaunchpadStudio />);

      const vestingTab = screen.getByText(/Vesting/i);
      fireEvent.click(vestingTab);

      expect(screen.getByText(/Vesting Schedule Builder/i)).toBeInTheDocument();

      const airdropTab = screen.getByText(/Airdrop/i);
      fireEvent.click(airdropTab);

      expect(screen.getByText(/Airdrop Manager/i)).toBeInTheDocument();
    });
  });

  describe('Launch Flow Integration', () => {
    it('completes full launch flow', async () => {
      const mockLaunchConfig = {
        id: 'test-launch-id',
        name: 'Integration Token',
        symbol: 'INTEG',
        decimals: 9,
        totalSupply: 1000000000,
        description: 'Integration test token',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
      };

      const mockCreateResponse = {
        success: true,
        mintAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        transactionSignature: '5j7s6NiJS3JAkvgkoc18WVAsiSaci2pxB2A6ueCJP4tprA2TFg9wSyTLeYouxPBJEMzJinENTkpA52YStRW5Dia7',
      };

      vi.mocked(invoke)
        .mockResolvedValueOnce(mockLaunchConfig) // create_launch_config
        .mockResolvedValueOnce({ success: true, computeUnits: 200000, feeEstimate: 5000, logs: [], warnings: [] }) // simulate
        .mockResolvedValueOnce({ passed: true, securityScore: 90, riskLevel: 'low', checks: [], timestamp: new Date().toISOString() }) // safety check
        .mockResolvedValueOnce(mockCreateResponse); // launchpad_create_token

      const mockOnLaunchCreated = vi.fn();
      const { getByLabelText, getByText } = render(
        <TokenConfig onLaunchCreated={mockOnLaunchCreated} />
      );

      // Fill form
      fireEvent.change(getByLabelText(/Token Name/i), { target: { value: 'Integration Token' } });
      fireEvent.change(getByLabelText(/Symbol/i), { target: { value: 'INTEG' } });

      // Save draft
      fireEvent.click(getByText(/Save Draft/i));
      await waitFor(() => expect(invoke).toHaveBeenCalledWith('create_launch_config', expect.any(Object)));

      // Simulate
      fireEvent.click(getByText(/Simulate & Check Safety/i));
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('simulate_token_creation', expect.any(Object));
        expect(invoke).toHaveBeenCalledWith('check_launch_safety', expect.any(Object));
      });

      // Launch
      fireEvent.click(getByText(/Launch Token/i));
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith('launchpad_create_token', expect.any(Object));
      });
    });
  });

  describe('Safety Checks', () => {
    it('shows warnings for mint authority', async () => {
      const mockSafetyCheck = {
        passed: false,
        securityScore: 70,
        riskLevel: 'medium',
        checks: [
          {
            checkName: 'Token Authorities',
            passed: false,
            severity: 'high',
            message: 'Mint or freeze authority is enabled',
            recommendation: 'Consider disabling authorities after launch',
          },
        ],
        timestamp: new Date().toISOString(),
      };

      vi.mocked(invoke)
        .mockResolvedValueOnce({ success: true, computeUnits: 200000, feeEstimate: 5000, logs: [], warnings: ['Mint authority enabled'] })
        .mockResolvedValueOnce(mockSafetyCheck);

      const mockOnLaunchCreated = vi.fn();
      const { getByText } = render(
        <TokenConfig onLaunchCreated={mockOnLaunchCreated} />
      );

      fireEvent.click(getByText(/Simulate & Check Safety/i));

      await waitFor(() => {
        expect(screen.getByText(/Mint or freeze authority is enabled/i)).toBeInTheDocument();
        expect(screen.getByText(/Consider disabling authorities after launch/i)).toBeInTheDocument();
      });
    });
  });
});
