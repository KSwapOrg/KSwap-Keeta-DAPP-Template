'use client';

import { useState } from 'react';
import { Wallet, Loader2, AlertCircle } from 'lucide-react';

interface WalletConnectorProps {
  onConnect: (network: 'mainnet' | 'testnet', seed?: string) => Promise<void>;
  isConnecting: boolean;
}

export function WalletConnector({ onConnect, isConnecting }: WalletConnectorProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet'>('testnet');
  const [customSeed, setCustomSeed] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    console.log('🔗 [WALLET] Connect button clicked', { 
      network: selectedNetwork, 
      hasSeed: !!(customSeed || undefined) 
    });
    setError(null);
    try {
      console.log('🔗 [WALLET] Calling parent onConnect...');
      await onConnect(selectedNetwork, customSeed || undefined);
      console.log('✅ [WALLET] Parent onConnect completed successfully');
    } catch (err) {
      console.error('❌ [WALLET] Connect failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      console.error('❌ [WALLET] Error set to:', errorMessage);
    }
  };

  return (
    <div className="card p-8 max-w-md w-full mx-auto animate-slide-up">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect to K-Swap
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your Keeta wallet to start trading
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Network Selection */}
        <div>
          <label className="label mb-2 block">Network</label>
          <div className="grid grid-cols-2 gap-2">
            {(['testnet', 'mainnet'] as const).map((network) => (
              <button
                key={network}
                onClick={() => {
                  console.log(`🌐 [WALLET] Network selected: ${network}`);
                  setSelectedNetwork(network);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedNetwork === network
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-medium capitalize">{network}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {network === 'testnet' ? 'For testing' : 'Production'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <label className="label mb-2 block">Custom Seed (Optional)</label>
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Enter custom seed phrase..."
                className="input w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to generate a new random wallet
              </p>
            </div>
          )}
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary w-full h-12 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>This will create or import a Keeta wallet</p>
          <p>Make sure to save your seed phrase securely</p>
        </div>
      </div>

      {/* Keeta Integration Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Keeta Wallet Integration
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          For production use, connect through the official Keeta Wallet app or browser extension.
          This demo uses direct SDK integration for development purposes.
        </p>
      </div>
    </div>
  );
}
