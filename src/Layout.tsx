import { WalletConnect } from './components/WalletConnect';
import { Diagnostics } from './components/Diagnostics';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 p-4 flex justify-between">
        <h1 className="text-xl font-bold">Eclipse Market Pro</h1>
        <div className="flex gap-4">
          <WalletConnect />
          <Diagnostics />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
