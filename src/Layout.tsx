import { WalletConnect } from './components/WalletConnect';
import { Diagnostics } from './components/Diagnostics';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen eclipse-gradient text-[var(--color-text)]">
      <header className="glass-header border-b p-4 flex justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-xl font-bold eclipse-accent">Eclipse Market Pro</h1>
        <div className="flex gap-4">
          <WalletConnect />
          <Diagnostics />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
