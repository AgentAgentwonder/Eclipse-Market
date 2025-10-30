import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useMotionPreferences } from '../hooks/useMotionPreferences';
import { EclipseLoader } from '../components/common/EclipseLoader';
import { MoonPhaseIndicator } from '../components/common/MoonPhaseIndicator';
import { ProgressBar } from '../components/common/ProgressBar';
import { ConstellationBackground } from '../components/common/ConstellationBackground';
import { getAccessibleVariants, cardHoverVariants } from '../utils/animations';
import { useAccessibilityStore } from '../store/accessibilityStore';

// Mock framer-motion's useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('Animation Accessibility', () => {
  beforeEach(() => {
    // Reset accessibility store before each test
    useAccessibilityStore.getState().resetToDefaults();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useMotionPreferences', () => {
    it('should return false when reduced motion is not enabled', () => {
      const { result } = renderHook(() => useMotionPreferences());
      expect(result.current).toBe(false);
    });

    it('should return true when reduced motion is enabled in store', () => {
      useAccessibilityStore.getState().toggleReducedMotion();
      const { result } = renderHook(() => useMotionPreferences());
      expect(result.current).toBe(true);
    });

    it('should respect system preference for reduced motion', async () => {
      const { useReducedMotion } = await import('framer-motion');
      vi.mocked(useReducedMotion).mockReturnValue(true);
      
      const { result } = renderHook(() => useMotionPreferences());
      expect(result.current).toBe(true);
    });
  });

  describe('EclipseLoader', () => {
    it('should render with default size', () => {
      render(<EclipseLoader />);
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should render with custom size', () => {
      const { container } = render(<EclipseLoader size="lg" />);
      const loader = container.querySelector('[role="status"]');
      expect(loader).toBeInTheDocument();
    });

    it('should respect reduced motion accessibility settings', () => {
      useAccessibilityStore.getState().toggleReducedMotion();
      render(<EclipseLoader />);
      
      const loader = screen.getByRole('status', { name: /loading/i });
      expect(loader).toBeInTheDocument();
    });
  });

  describe('MoonPhaseIndicator', () => {
    it('should render with phase label', () => {
      render(<MoonPhaseIndicator phase={0} showLabel />);
      expect(screen.getByText('New Moon')).toBeInTheDocument();
    });

    it('should render correct phase label for different values', () => {
      const { rerender } = render(<MoonPhaseIndicator phase={0.5} showLabel />);
      expect(screen.getByText('Full Moon')).toBeInTheDocument();
      
      rerender(<MoonPhaseIndicator phase={0.25} showLabel />);
      expect(screen.getByText('First Quarter')).toBeInTheDocument();
    });

    it('should handle invalid phase values', () => {
      render(<MoonPhaseIndicator phase={NaN} showLabel />);
      expect(screen.getByText('New Moon')).toBeInTheDocument();
    });

    it('should render without label when showLabel is false', () => {
      render(<MoonPhaseIndicator phase={0.5} showLabel={false} />);
      expect(screen.queryByText('Full Moon')).not.toBeInTheDocument();
    });

    it('should have proper aria-label', () => {
      render(<MoonPhaseIndicator phase={0.5} />);
      expect(screen.getByLabelText('Moon phase: Full Moon')).toBeInTheDocument();
    });
  });

  describe('ProgressBar', () => {
    it('should render with correct progress value', () => {
      render(<ProgressBar value={50} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should clamp values between 0 and 100', () => {
      const { rerender } = render(<ProgressBar value={150} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');

      rerender(<ProgressBar value={-50} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should display label when provided', () => {
      render(<ProgressBar value={50} label="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display percentage when showPercentage is true', () => {
      render(<ProgressBar value={75} showPercentage />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render different size variants', () => {
      const { container } = render(<ProgressBar value={50} size="lg" />);
      expect(container.querySelector('.h-3')).toBeInTheDocument();
    });

    it('should render different color variants', () => {
      const { container } = render(<ProgressBar value={50} variant="success" />);
      expect(container.querySelector('.from-emerald-500')).toBeInTheDocument();
    });

    it('should respect reduced motion settings', () => {
      useAccessibilityStore.getState().toggleReducedMotion();
      render(<ProgressBar value={50} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show indeterminate state', () => {
      render(<ProgressBar value={0} indeterminate />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('ConstellationBackground', () => {
    it('should render with default star and link counts', () => {
      const { container } = render(<ConstellationBackground />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with custom star and link counts', () => {
      const { container } = render(<ConstellationBackground starCount={20} linkCount={10} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      const stars = container.querySelectorAll('.constellation-stars circle');
      const links = container.querySelectorAll('.constellation-links line');
      
      expect(stars.length).toBe(20);
      expect(links.length).toBeLessThanOrEqual(10);
    });

    it('should have aria-hidden attribute', () => {
      const { container } = render(<ConstellationBackground />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply custom opacity', () => {
      const { container } = render(<ConstellationBackground opacity={0.5} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('Animation Utilities', () => {
    it('should strip transitions from variants when reduced motion is enabled', () => {
      const accessibleVariants = getAccessibleVariants(cardHoverVariants, true);
      
      expect(accessibleVariants.hover).toBeDefined();
      expect(accessibleVariants.hover).not.toHaveProperty('transition');
    });

    it('should keep original variants when reduced motion is disabled', () => {
      const accessibleVariants = getAccessibleVariants(cardHoverVariants, false);
      
      expect(accessibleVariants).toEqual(cardHoverVariants);
    });
  });

  describe('Accessibility Integration', () => {
    it('should apply CSS class when reduced motion is toggled', () => {
      useAccessibilityStore.getState().toggleReducedMotion();
      
      const root = document.documentElement;
      expect(root.classList.contains('reduce-motion')).toBe(true);
    });

    it('should update CSS variable when reduced motion is toggled', () => {
      useAccessibilityStore.getState().toggleReducedMotion();
      
      const root = document.documentElement;
      const motionDuration = root.style.getPropertyValue('--motion-duration');
      expect(motionDuration).toBe('0.01ms');
    });

    it('should reset to normal when reduced motion is disabled', () => {
      const store = useAccessibilityStore.getState();
      store.toggleReducedMotion(); // Enable
      store.toggleReducedMotion(); // Disable
      
      const root = document.documentElement;
      expect(root.classList.contains('reduce-motion')).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should memoize MoonPhaseIndicator', () => {
      const { rerender } = render(<MoonPhaseIndicator phase={0.5} />);
      const firstRender = screen.getByLabelText(/moon phase/i);
      
      rerender(<MoonPhaseIndicator phase={0.5} />);
      const secondRender = screen.getByLabelText(/moon phase/i);
      
      expect(firstRender).toBe(secondRender);
    });

    it('should memoize ProgressBar', () => {
      const { rerender } = render(<ProgressBar value={50} />);
      const firstRender = screen.getByRole('progressbar');
      
      rerender(<ProgressBar value={50} />);
      const secondRender = screen.getByRole('progressbar');
      
      expect(firstRender).toBe(secondRender);
    });

    it('should memoize ConstellationBackground', () => {
      const { rerender, container } = render(<ConstellationBackground starCount={30} />);
      const firstRender = container.querySelector('svg');
      
      rerender(<ConstellationBackground starCount={30} />);
      const secondRender = container.querySelector('svg');
      
      expect(firstRender).toBe(secondRender);
    });
  });
});
