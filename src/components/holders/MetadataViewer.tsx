import { ExternalLink, Calendar, User, Code, Info } from 'lucide-react';
import { TokenMetadata } from '../../types/holders';

interface Props {
  metadata: TokenMetadata;
}

export function MetadataViewer({ metadata }: Props) {
  const formatAddress = (address: string) => {
    if (address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Token Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Token Name</p>
            <p className="text-lg font-semibold">{metadata.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Symbol</p>
            <p className="text-lg font-semibold">{metadata.symbol}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Supply</p>
            <p className="text-lg font-semibold font-mono">
              {metadata.totalSupply.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Decimals</p>
            <p className="text-lg font-semibold">{metadata.decimals}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-400 mb-1">Contract Address</p>
            <p className="text-lg font-mono break-all">{metadata.address}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {metadata.description && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Description
          </h3>
          <p className="text-gray-300 leading-relaxed">{metadata.description}</p>
        </div>
      )}

      {/* Social Links */}
      {(metadata.website || metadata.twitter || metadata.telegram || metadata.discord) && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Social Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metadata.website && (
              <a
                href={metadata.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-purple-400" />
                <span>Website</span>
              </a>
            )}
            {metadata.twitter && (
              <a
                href={metadata.twitter}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <span>Twitter</span>
              </a>
            )}
            {metadata.telegram && (
              <a
                href={metadata.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-sky-400" />
                <span>Telegram</span>
              </a>
            )}
            {metadata.discord && (
              <a
                href={metadata.discord}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Discord</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Technical Details */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Technical Details
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Creation Date
            </p>
            <p className="font-mono">{new Date(metadata.creationDate).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Creator
            </p>
            <p className="font-mono break-all">{formatAddress(metadata.creator)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Token Program</p>
            <p className="font-mono break-all">{metadata.tokenProgram}</p>
          </div>
          {metadata.mintAuthority && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Mint Authority</p>
              <p className="font-mono break-all">{formatAddress(metadata.mintAuthority)}</p>
            </div>
          )}
          {metadata.freezeAuthority && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Freeze Authority</p>
              <p className="font-mono break-all">{formatAddress(metadata.freezeAuthority)}</p>
            </div>
          )}
          {metadata.updateAuthority && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Update Authority</p>
              <p className="font-mono break-all">{formatAddress(metadata.updateAuthority)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
