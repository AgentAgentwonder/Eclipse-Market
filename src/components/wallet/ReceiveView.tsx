import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Copy, Download, Share2, QrCode, AlertCircle } from 'lucide-react';
import type { SolanaPayQR, QRCodeData } from '../../types/wallet';

interface ReceiveViewProps {
  address: string | null;
}

export function ReceiveView({ address }: ReceiveViewProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [solanaPayQR, setSolanaPayQR] = useState<SolanaPayQR | null>(null);
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;

    generateQr();
  }, [address]);

  const generateQr = async () => {
    if (!address) return;

    setError(null);

    try {
      const data: QRCodeData = {
        address,
        amount: amount ? parseFloat(amount) : undefined,
        label: label || undefined,
        message: message || undefined,
      };

      const basic = await invoke<string>('wallet_generate_qr', { data });
      setQrData(basic);

      const solPay = await invoke<SolanaPayQR>('wallet_generate_solana_pay_qr', {
        recipient: address,
        amount: amount ? parseFloat(amount) : null,
        label: label || null,
        message: message || null,
        memo: null,
        reference: null,
        splToken: null,
      });
      setSolanaPayQR(solPay);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopy = async () => {
    if (!address) return;

    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.href = qrData;
    link.download = 'wallet-address-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!address) return;

    const shareDetails = {
      title: 'Solana Wallet Address',
      text: message || 'Send SOL or tokens to this address',
      url: solanaPayQR?.url || address,
    };

    if (navigator.share) {
      await navigator.share(shareDetails);
    } else {
      await navigator.clipboard.writeText(shareDetails.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Connect a wallet to get a receive address</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-700/50 rounded-2xl p-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20">
            <QrCode className="w-8 h-8 text-purple-400" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Your Solana Address</p>
            <p className="font-mono text-lg break-all">{address}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Generate QR</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount (Optional)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                step="any"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Name or reference"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Message</label>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Short message"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            onClick={generateQr}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
          >
            Update QR Code
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Solana Pay</h3>

          {solanaPayQR ? (
            <div className="space-y-4">
              <img
                src={solanaPayQR.qr_data}
                alt="Solana Pay QR"
                className="w-full rounded-xl bg-white p-6"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">URI</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(solanaPayQR.url)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-mono text-xs break-all">{solanaPayQR.url}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No Solana Pay request generated yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
