'use client';

import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { TokenId } from '../types';

interface TokenSelectorProps {
  selectedToken: TokenId | null;
  onSelectToken: (token: TokenId) => void;
  availableTokens: TokenId[];
  tokenInfoMap?: Record<string, any>;
}

export function TokenSelector({ selectedToken, onSelectToken, availableTokens, tokenInfoMap = {} }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = availableTokens.filter(token =>
    token.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (token: TokenId) => {
    console.log('🪙 [TOKEN_SELECTOR] Token selected:', token);
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getTokenSymbol = (tokenId: TokenId) => {
    // Use real token info if available
    const tokenInfo = tokenInfoMap[tokenId];
    if (tokenInfo?.symbol) {
      return tokenInfo.symbol;
    }
    
    // Fallback for KTA and unknown tokens
    if (tokenId === 'KTA') return 'KTA';
    return tokenId.slice(0, 6).toUpperCase();
  };

  const getTokenName = (tokenId: TokenId) => {
    // Use real token info if available
    const tokenInfo = tokenInfoMap[tokenId];
    if (tokenInfo?.name) {
      return tokenInfo.name;
    }
    
    // Fallback names
    const names: Record<string, string> = {
      'KTA': 'Keeta Token',
    };
    return names[tokenId] || `Token ${tokenId.slice(0, 8)}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log('🪙 [TOKEN_SELECTOR] Token selector opened');
          setIsOpen(true);
        }}
        className="flex items-center space-x-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 transition-colors"
      >
        {selectedToken ? (
          <>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {getTokenSymbol(selectedToken)[0]}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {getTokenSymbol(selectedToken)}
            </span>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Select token</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Token
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto">
              {filteredTokens.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No tokens found
                </div>
              ) : (
                <div className="p-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => handleSelect(token)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedToken === token ? 'bg-primary/10 border border-primary/20' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {getTokenSymbol(token)[0]}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getTokenSymbol(token)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getTokenName(token)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tokenInfoMap[token]?.balance 
                          ? (Number(tokenInfoMap[token].balance) / 1e9).toFixed(2)
                          : '0.00'
                        }
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Can't find your token? Make sure it's created on Keeta Network.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
