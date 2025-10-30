import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReputationBadge, ReputationWarning } from '../../components/reputation/ReputationBadge';

describe('ReputationBadge', () => {
  it('renders excellent level correctly', () => {
    render(<ReputationBadge level="excellent" score={95} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('renders good level correctly', () => {
    render(<ReputationBadge level="good" score={70} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('renders neutral level correctly', () => {
    render(<ReputationBadge level="neutral" score={50} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders poor level correctly', () => {
    render(<ReputationBadge level="poor" score={30} />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders malicious level correctly', () => {
    render(<ReputationBadge level="malicious" score={10} />);
    expect(screen.getByText('Malicious')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ReputationBadge level="excellent" score={95} showLabel={false} />);
    expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { container } = render(<ReputationBadge level="excellent" score={95} size="lg" />);
    const badge = container.querySelector('div');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('displays tooltip with score', () => {
    render(<ReputationBadge level="excellent" score={95.7} />);
    const badge = screen.getByTitle('Reputation Score: 95.7');
    expect(badge).toBeInTheDocument();
  });
});

describe('ReputationWarning', () => {
  it('does not render for good reputation', () => {
    const { container } = render(<ReputationWarning level="good" />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render for excellent reputation', () => {
    const { container } = render(<ReputationWarning level="excellent" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders warning for poor reputation', () => {
    render(<ReputationWarning level="poor" />);
    expect(screen.getByText(/Warning: This address has a poor reputation score/)).toBeInTheDocument();
  });

  it('renders warning for malicious reputation', () => {
    render(<ReputationWarning level="malicious" />);
    expect(screen.getByText(/High risk: This address shows suspicious activity patterns/)).toBeInTheDocument();
  });

  it('renders blacklist warning with reason', () => {
    render(
      <ReputationWarning
        level="neutral"
        isBlacklisted={true}
        blacklistReason="Reported for scam activity"
      />
    );
    expect(screen.getByText('Reported for scam activity')).toBeInTheDocument();
  });

  it('renders default blacklist message when no reason provided', () => {
    render(<ReputationWarning level="neutral" isBlacklisted={true} />);
    expect(screen.getByText('This address has been blacklisted')).toBeInTheDocument();
  });

  it('applies correct styling for blacklisted addresses', () => {
    const { container } = render(
      <ReputationWarning level="neutral" isBlacklisted={true} />
    );
    const warning = container.querySelector('div');
    expect(warning).toHaveClass('bg-red-500/10', 'border-red-500/30');
  });

  it('applies correct styling for poor reputation', () => {
    const { container } = render(<ReputationWarning level="poor" />);
    const warning = container.querySelector('div');
    expect(warning).toHaveClass('bg-orange-500/10', 'border-orange-500/30');
  });
});
