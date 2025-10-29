import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Copy,
  ExternalLink,
  QrCode,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Zap,
  X,
  Tag,
  ChartLine,
} from 'lucide-react';
import QRCode from 'qrcode';
import { EnhancedAlertNotification } from '../../types/alertNotifications';
import { useAddressLabelStore } from '../../store/addressLabelStore';

interface EnhancedAlertNotificationProps {
  notification: EnhancedAlertNotification;
  onDismiss: () => void;
  onOpenChart?: (symbol: string, timestamp: string) => void;
}

const EnhancedAlertNotificationComponent: React.FC<EnhancedAlertNotificationProps> = ({
  notification,
  onDismiss,
  onOpenChart,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { getLabel, addLabel } = useAddressLabelStore();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShowQr = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#a855f7',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
      setShowQr(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleAddNickname = (address: string) => {
    const nickname = prompt('Enter a nickname for this address:');
    if (nickname) {
      addLabel({
        address,
        label: nickname,
        nickname,
        isKnown: true,
        category: 'custom',
      });
    }
  };

  const getAddressDisplay = (address: string, label?: string, ens?: string, sns?: string) => {
    if (label) return label;
    if (ens) return ens;
    if (sns) return sns;
    const storedLabel = getLabel(address);
    if (storedLabel?.label) return storedLabel.label;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const isKnown = (address: string) => {
    const storedLabel = getLabel(address);
    return storedLabel?.isKnown || false;
  };

  const explorerUrl = (signature: string) => {
    return `https://solscan.io/tx/${signature}`;
  };

  const addressExplorerUrl = (address: string) => {
    return `https://solscan.io/account/${address}`;
  };

  const isPricePositive = (notification.priceChange24h ?? 0) >= 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-purple-200">Alert Triggered</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Alert Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{notification.alertName}</h3>
            <p className="text-sm text-slate-400">{notification.conditionsMet}</p>
          </div>

          {/* Price Info */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
            <div>
              <p className="text-sm text-slate-400 mb-1">{notification.symbol}</p>
              <p className="text-2xl font-bold">${notification.currentPrice.toFixed(6)}</p>
            </div>
            {notification.priceChange24h !== undefined && (
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                  isPricePositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isPricePositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold text-sm">
                  {isPricePositive ? '+' : ''}
                  {notification.priceChange24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          {notification.transaction && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Transaction</span>
                <div className="flex items-center gap-2">
                  <code className="text-purple-300 text-xs">
                    {notification.transaction.signature.slice(0, 8)}...
                  </code>
                  <button
                    onClick={() => handleCopy(notification.transaction!.signature, 'signature')}
                    className="p-1 hover:bg-purple-500/20 rounded transition"
                    title="Copy signature"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                    href={explorerUrl(notification.transaction.signature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-purple-500/20 rounded transition"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Amount & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">Amount</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {notification.transaction.amount.toFixed(4)} {notification.transaction.tokenSymbol}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">USD Value</span>
                  </div>
                  <p className="text-sm font-semibold">
                    ${notification.transaction.usdValue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Fee & Slippage */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Fee:</span>{' '}
                  <span className="text-white">{notification.transaction.fee.toFixed(6)} SOL</span>
                </div>
                {notification.transaction.slippage !== undefined && (
                  <div>
                    <span className="text-slate-400">Slippage:</span>{' '}
                    <span className="text-white">{notification.transaction.slippage.toFixed(2)}%</span>
                  </div>
                )}
              </div>

              {/* Addresses */}
              <div className="space-y-2">
                {/* From Address */}
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">From</span>
                    <div className="flex items-center gap-1">
                      {isKnown(notification.transaction.fromAddress) && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                          Known
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono truncate flex-1">
                      {getAddressDisplay(
                        notification.transaction.fromAddress,
                        notification.transaction.fromLabel,
                        notification.transaction.fromEns,
                        notification.transaction.fromSns
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(notification.transaction!.fromAddress, 'from')}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Copy address"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleShowQr(notification.transaction!.fromAddress)}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Show QR code"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAddNickname(notification.transaction!.fromAddress)}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Add nickname"
                      >
                        <Tag className="w-3 h-3" />
                      </button>
                      <a
                        href={addressExplorerUrl(notification.transaction.fromAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* To Address */}
                <div className="p-3 bg-slate-800/40 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">To</span>
                    <div className="flex items-center gap-1">
                      {isKnown(notification.transaction.toAddress) && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                          Known
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono truncate flex-1">
                      {getAddressDisplay(
                        notification.transaction.toAddress,
                        notification.transaction.toLabel,
                        notification.transaction.toEns,
                        notification.transaction.toSns
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(notification.transaction!.toAddress, 'to')}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Copy address"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleShowQr(notification.transaction!.toAddress)}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Show QR code"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAddNickname(notification.transaction!.toAddress)}
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="Add nickname"
                      >
                        <Tag className="w-3 h-3" />
                      </button>
                      <a
                        href={addressExplorerUrl(notification.transaction.toAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-purple-500/20 rounded transition"
                        title="View on explorer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Time */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{new Date(notification.transaction.timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Context Message */}
          {notification.contextMessage && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
              {notification.contextMessage}
            </div>
          )}

          {/* Similar Opportunities */}
          {notification.similarOpportunities && notification.similarOpportunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Similar Opportunities</p>
              <div className="space-y-1">
                {notification.similarOpportunities.slice(0, 3).map((opp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg text-sm hover:bg-slate-800/60 transition cursor-pointer"
                    onClick={() => onOpenChart?.(opp.symbol, notification.triggeredAt)}
                  >
                    <div>
                      <p className="font-semibold">{opp.symbol}</p>
                      <p className="text-xs text-slate-400">{opp.matchReason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${opp.currentPrice.toFixed(6)}</p>
                      <p
                        className={`text-xs ${
                          opp.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {opp.priceChange24h >= 0 ? '+' : ''}
                        {opp.priceChange24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onOpenChart?.(notification.symbol, notification.triggeredAt)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl font-semibold transition"
            >
              <ChartLine className="w-4 h-4" />
              View Chart
            </button>
            <button
              onClick={() => onOpenChart?.(notification.symbol, notification.triggeredAt)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Copied Indicator */}
          {copiedField && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center text-green-400"
            >
              Copied {copiedField}!
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* QR Code Modal */}
      {showQr && qrCodeUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowQr(false)}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-white p-6 rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img src={qrCodeUrl} alt="Address QR Code" className="w-64 h-64" />
            <button
              onClick={() => setShowQr(false)}
              className="mt-4 w-full px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default EnhancedAlertNotificationComponent;
