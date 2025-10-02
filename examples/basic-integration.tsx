/**
 * Basic Keeta DApp Integration Example
 * Shows how to connect to KSwap Wallet Extension and interact with Keeta Network
 */

import React, { useState, useEffect } from 'react';

export function BasicDApp() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Check if wallet extension is installed
  useEffect(() => {
    if (window.keeta?.isKeeta) {
      console.log('✅ Keeta Wallet detected!');
    } else {
      console.log('❌ Keeta Wallet not found. Please install KSwap Wallet Extension.');
    }
  }, []);

  // Connect wallet
  const handleConnect = async () => {
    try {
      if (!window.keeta) {
        alert('Please install KSwap Wallet Extension');
        return;
      }

      const accounts = await window.keeta.connect();
      setAccount(accounts[0]);
      setConnected(true);
      
      // Get initial balance
      await updateBalance();
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect wallet');
    }
  };

  // Update balance
  const updateBalance = async () => {
    if (!window.keeta || !account) return;
    
    try {
      const bal = await window.keeta.getBalance('KTA');
      // Convert from smallest units (9 decimals for KTA)
      const formatted = (Number(bal) / 1e9).toFixed(4);
      setBalance(formatted);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Send transaction
  const handleSend = async () => {
    if (!window.keeta || !recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Convert to smallest units (9 decimals)
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e9));
      
      const txId = await window.keeta.sendTransaction(
        recipient,
        amountBigInt,
        'KTA'
      );
      
      alert(`Transaction sent! TX: ${txId}`);
      
      // Refresh balance after transaction
      setTimeout(updateBalance, 2000);
      
      // Clear form
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + error.message);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!window.keeta) return;

    const handleAccountChange = (newAccount: string) => {
      console.log('Account changed:', newAccount);
      setAccount(newAccount);
      updateBalance();
    };

    const handleNetworkChange = (network: string) => {
      console.log('Network changed:', network);
      updateBalance();
    };

    window.keeta.on('accountChanged', handleAccountChange);
    window.keeta.on('networkChanged', handleNetworkChange);

    return () => {
      window.keeta?.off('accountChanged', handleAccountChange);
      window.keeta?.off('networkChanged', handleNetworkChange);
    };
  }, [account]);

  if (!connected) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Welcome to Keeta DApp</h1>
        <p>Connect your wallet to get started</p>
        <button 
          onClick={handleConnect}
          style={{
            background: '#7091DF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Keeta DApp</h1>
      
      {/* Account Info */}
      <div style={{ 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3>Account</h3>
        <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>{account}</p>
        <h3 style={{ marginTop: '16px' }}>Balance</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{balance} KTA</p>
      </div>

      {/* Send Form */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3>Send KTA</h3>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Recipient Address:
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="keeta_..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Amount (KTA):
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              fontSize: '14px'
            }}
          />
        </div>
        <button
          onClick={handleSend}
          style={{
            background: '#7091DF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '20px',
            width: '100%'
          }}
        >
          Send Transaction
        </button>
      </div>
    </div>
  );
}

// TypeScript declaration for window.keeta
declare global {
  interface Window {
    keeta?: {
      isKeeta: boolean;
      connect(): Promise<string[]>;
      getAccount(): Promise<string>;
      getBalance(tokenId: string): Promise<bigint>;
      sendTransaction(to: string, amount: bigint, tokenId: string): Promise<string>;
      on(event: string, handler: Function): void;
      off(event: string, handler: Function): void;
    };
  }
}

