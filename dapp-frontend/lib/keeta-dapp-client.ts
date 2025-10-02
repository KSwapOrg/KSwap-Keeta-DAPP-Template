import * as KeetaNet from '@keetanetwork/keetanet-client';

// Use numeric values directly (TOKEN = 3)
// AccountKeyAlgorithm enum not available in browser
const TOKEN_ALGORITHM = 3;
import { KSwapCore } from './kswap-core';
import {
  TokenId,
  AccountId,
  TokenInfo,
  Pool,
  PoolStats,
  PoolEvent,
  NetworkConfig,
  NETWORK_CONFIGS,
  KSwapError,
  KSwapErrorCode,
} from '../types';

/**
 * Main K-Swap client that wraps Keeta SDK and provides high-level DEX operations
 * Follows the implementation guide from the PRD
 */
export class KSwapClient {
  private client: KeetaNet.UserClient;
  private signer: any; // KeetaNet.lib.Account type issue
  private core: KSwapCore;
  private network: NetworkConfig;

  private constructor(
    client: KeetaNet.UserClient,
    signer: any,
    network: NetworkConfig
  ) {
    this.client = client;
    this.signer = signer;
    this.network = network;
    // Initialize with multi-sig configuration
    const multiSigSigners = network.multiSigSigners || [];
    const governanceAccount = network.governanceAccount || network.treasuryAccount;
    
    this.core = new KSwapCore(
      client, 
      signer, 
      network.treasuryAccount,
      multiSigSigners,
      governanceAccount
    );
  }

  /**
   * Initialize K-Swap client with network and signer
   * Step 1 from the implementation guide
   */
  static async initialize(
    networkName: 'mainnet' | 'testnet',
    seed?: string
  ): Promise<KSwapClient> {
    console.log('🚀 [CLIENT] Initialize called', { networkName, hasSeed: !!seed });
    
    try {
      console.log('🚀 [CLIENT] Importing KeetaNet SDK...');
      // Check if KeetaNet is available
      if (!KeetaNet || !KeetaNet.lib || !KeetaNet.lib.Account) {
        throw new Error('KeetaNet SDK not properly loaded');
      }
      console.log('✅ [CLIENT] KeetaNet SDK available');

      // Generate or use provided seed
      console.log('🔑 [CLIENT] Generating/using seed...');
      const seedString = seed || KeetaNet.lib.Account.generateRandomSeed({ asString: true });
      console.log('🔑 [CLIENT] Seed ready (length:', seedString.length, ')');
      
      console.log('🔑 [CLIENT] Creating account from seed...');
      const signer = KeetaNet.lib.Account.fromSeed(seedString, 0);
      console.log('✅ [CLIENT] Account created:', signer.publicKeyString);
      
      // Connect to network
      const keetaNetworkName = networkName === 'mainnet' ? 'main' : 'test';
      console.log('🌐 [CLIENT] Connecting to network:', keetaNetworkName);
      const client = KeetaNet.UserClient.fromNetwork(keetaNetworkName, signer);
      console.log('✅ [CLIENT] UserClient created');
      
      const network = NETWORK_CONFIGS[networkName];
      console.log('⚙️ [CLIENT] Network config:', network);

      // Verify connection
      console.log('🔍 [CLIENT] Verifying connection with chain() call...');
      const chainInfo = await client.chain();
      console.log('✅ [CLIENT] Chain info received:', chainInfo);
      
      console.log('🎉 [CLIENT] Creating KSwapClient instance...');
      const kswapClient = new KSwapClient(client, signer, network);
      console.log('✅ [CLIENT] KSwapClient initialized successfully!');
      
      return kswapClient;
    } catch (error) {
      console.error('❌ [CLIENT] Initialize failed:', error);
      console.error('❌ [CLIENT] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      throw new KSwapError(
        KSwapErrorCode.NETWORK_ERROR,
        `Failed to initialize K-Swap client: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get account info and balances
   */
  async getAccountInfo() {
    console.log('👛 [CLIENT] Getting account info...');
    
    try {
      console.log('👛 [CLIENT] Getting base token...');
      const baseToken = this.client.baseToken;
      console.log('👛 [CLIENT] Base token:', baseToken);
      console.log('👛 [CLIENT] Base token type:', typeof baseToken);
      console.log('👛 [CLIENT] Base token keys:', Object.keys(baseToken || {}));
      
      console.log('👛 [CLIENT] Getting balance...');
      const balance = await this.client.balance(baseToken);
      console.log('👛 [CLIENT] Balance:', balance);
      
      const result = {
        address: this.signer.publicKeyString.get(),
        baseToken,
        balance,
        network: this.network.name,
      };
      
      console.log('✅ [CLIENT] Account info compiled:', result);
      return result;
    } catch (error) {
      console.error('❌ [CLIENT] Failed to get account info:', error);
      throw error;
    }
  }

  /**
   * Get token balance for the connected account
   */
  async getTokenBalance(tokenId: TokenId): Promise<bigint> {
    return await this.client.balance(tokenId);
  }

  /**
   * Initialize the factory (call this once before creating pools)
   */
  async initializeFactory(): Promise<AccountId> {
    console.log('🏭 [CLIENT] Initializing factory...');
    return await this.core.initializeFactory();
  }

  /**
   * Create a new liquidity pool using factory pattern
   * Step 2 from the implementation guide - now with multi-sig security
   */
  async createPool(
    tokenA: TokenId,
    tokenB: TokenId,
    initialAmountA: bigint,
    initialAmountB: bigint,
    feeBps?: number,
    protocolFeeBps?: number
  ) {
    console.log('🏊 [CLIENT] createPool called', {
      tokenA,
      tokenB,
      initialAmountA,
      initialAmountB,
      feeBps,
      protocolFeeBps
    });
    
    console.log('🏊 [CLIENT] Calling core.createPool...');
    const result = await this.core.createPool({
      tokenA,
      tokenB,
      initialAmountA,
      initialAmountB,
      feeBps,
      protocolFeeBps,
    });
    
    console.log('✅ [CLIENT] createPool result:', result);
    return result;
  }

  /**
   * Add liquidity to an existing pool
   * Step 3 from the implementation guide
   */
  async addLiquidity(
    poolId: AccountId,
    tokenA: TokenId,
    tokenB: TokenId,
    amountA: bigint,
    amountB: bigint,
    slippagePercent: number = 1,
    deadlineMinutes: number = 20
  ) {
    const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);
    
    // Calculate minimum LP tokens (allowing for slippage)
    const pool = await this.core.getPoolState(poolId, tokenA, tokenB);
    const { lpTokensToMint } = await this.calculateAddLiquidityAmounts(pool, amountA, amountB);
    const minLpTokens = (lpTokensToMint * BigInt(10000 - slippagePercent * 100)) / 10000n;

    return await this.core.addLiquidity({
      poolId,
      tokenA,
      tokenB,
      amountA,
      amountB,
      minLpTokens,
      deadline,
    });
  }

  /**
   * Remove liquidity from a pool
   * Step 4 from the implementation guide
   */
  async removeLiquidity(
    poolId: AccountId,
    tokenA: TokenId,
    tokenB: TokenId,
    lpTokenAmount: bigint,
    slippagePercent: number = 1,
    deadlineMinutes: number = 20
  ) {
    const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);
    
    // Calculate minimum amounts (allowing for slippage)
    const pool = await this.core.getPoolState(poolId, tokenA, tokenB);
    const amountA = (lpTokenAmount * pool.reserveA) / pool.totalLpSupply;
    const amountB = (lpTokenAmount * pool.reserveB) / pool.totalLpSupply;
    
    const minAmountA = (amountA * BigInt(10000 - slippagePercent * 100)) / 10000n;
    const minAmountB = (amountB * BigInt(10000 - slippagePercent * 100)) / 10000n;

    return await this.core.removeLiquidity({
      poolId,
      tokenA,
      tokenB,
      lpTokenAmount,
      minAmountA,
      minAmountB,
      deadline,
    });
  }

  /**
   * Execute a token swap
   * Step 5 from the implementation guide
   */
  async swap(
    poolId: AccountId,
    tokenIn: TokenId,
    tokenOut: TokenId,
    amountIn: bigint,
    slippagePercent: number = 1,
    deadlineMinutes: number = 20
  ) {
    const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);
    
    // Get quote and calculate minimum output
    const quote = await this.core.getSwapQuote(poolId, tokenIn, tokenOut, amountIn);
    const minAmountOut = (quote.amountOut * BigInt(10000 - slippagePercent * 100)) / 10000n;

    return await this.core.swap({
      poolId,
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      deadline,
    });
  }

  /**
   * Get swap quote (read-only)
   */
  async getSwapQuote(
    poolId: AccountId,
    tokenIn: TokenId,
    tokenOut: TokenId,
    amountIn: bigint
  ) {
    return await this.core.getSwapQuote(poolId, tokenIn, tokenOut, amountIn);
  }

  /**
   * Get pool state and reserves
   */
  async getPool(poolId: AccountId, tokenA: TokenId, tokenB: TokenId): Promise<Pool> {
    return await this.core.getPoolState(poolId, tokenA, tokenB);
  }

  /**
   * Get pool statistics (TVL, volume, fees, APR)
   * Step 8 from the implementation guide - analytics
   */
  async getPoolStats(poolId: AccountId, tokenA: TokenId, tokenB: TokenId): Promise<PoolStats> {
    const pool = await this.getPool(poolId, tokenA, tokenB);
    const history = await this.client.history({ address: poolId, limit: 1000 });
    
    // Calculate 24h volume and fees from history
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentEvents = history.filter(event => 
      new Date(event.timestamp).getTime() > oneDayAgo
    );
    
    let volume24h = 0n;
    let fees24h = 0n;
    
    // Parse swap events from history (simplified)
    for (const event of recentEvents) {
      // This would need proper event parsing based on Keeta's history format
      // For now, we'll use placeholder values
    }
    
    // Calculate TVL (Total Value Locked)
    const tvl = pool.reserveA + pool.reserveB; // Simplified - would need price oracles
    
    // Calculate APR based on fees
    const apr = Number(fees24h * 365n) / Number(tvl) * 100;
    
    // Calculate LP token price
    const lpPrice = pool.totalLpSupply > 0n ? 
      Number(tvl) / Number(pool.totalLpSupply) : 0;

    return {
      tvl,
      volume24h,
      fees24h,
      apr,
      lpPrice,
    };
  }

  /**
   * Get pool events/history for analytics
   * Step 6 from the implementation guide - debugging and history
   */
  async getPoolHistory(poolId: AccountId, limit: number = 100): Promise<PoolEvent[]> {
    const history = await this.client.history({ address: poolId, limit });
    
    // Parse Keeta history into K-Swap events
    const events: PoolEvent[] = [];
    
    for (const record of history) {
      // This would need proper parsing based on Keeta's history format
      // For now, we'll create a basic structure
      const event: PoolEvent = {
        type: 'SWAP', // Would be determined by parsing the operations
        poolId,
        user: record.from || 'unknown',
        timestamp: new Date(record.timestamp).getTime(),
        blockId: record.blockId || 'unknown',
        data: record,
      };
      events.push(event);
    }
    
    return events;
  }

  /**
   * Create a new token (for token creators)
   * Step 10 from the implementation guide
   */
  async createToken(
    symbol: string,
    name: string,
    decimals: number = 9,
    initialSupply?: bigint
  ): Promise<TokenId> {
    try {
      const tokenId = await this.client.generateIdentifier(TOKEN_ALGORITHM);
      const builder = this.client.initBuilder();
      
      // Set token metadata
      builder.setInfo(tokenId, {
        symbol,
        name,
        decimals,
      });
      
      // Mint initial supply if specified
      if (initialSupply && initialSupply > 0n) {
        builder.modifyTokenBalance(this.signer, tokenId, initialSupply);
      }
      
      await this.client.publishBuilder(builder);
      return tokenId;
    } catch (error) {
      throw new KSwapError(
        KSwapErrorCode.TRANSACTION_FAILED,
        `Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { symbol, name, decimals }
      );
    }
  }

  /**
   * Get token information from Keeta blockchain
   */
  async getTokenInfo(tokenId: TokenId): Promise<TokenInfo> {
    try {
      console.log('🪙 [CLIENT] Getting token info for:', tokenId);
      
      // For KTA (base token), return known info with real balance
      if (tokenId === 'KTA' || tokenId === this.client.baseToken) {
        const balance = await this.client.balance(this.client.baseToken);
        return {
          id: tokenId,
          symbol: 'KTA',
          name: 'Keeta Token',
          decimals: 9,
          balance: balance,
        };
      }

      // Try to get token account info from Keeta
      try {
        const tokenAccount = KeetaNet.lib.Account.fromPublicKeyString(tokenId);
        const state = await this.client.state({ account: tokenAccount });
        
        // Parse metadata if available
        let symbol = tokenId.slice(0, 6).toUpperCase();
        let name = `Token ${tokenId.slice(0, 8)}`;
        
        if (state.info?.metadata) {
          try {
            const decodedMetadata = JSON.parse(
              Buffer.from(state.info.metadata, 'base64').toString()
            );
            symbol = decodedMetadata.symbol || symbol;
            name = decodedMetadata.name || name;
          } catch (e) {
            console.log('🪙 [CLIENT] Could not parse token metadata');
          }
        }

        // Get user's balance for this token
        let balance = 0n;
        try {
          balance = await this.client.balance(tokenAccount);
        } catch (e) {
          console.log(`🪙 [CLIENT] No balance for ${symbol}`);
        }

        return {
          id: tokenId,
          symbol,
          name,
          decimals: 9, // Default, could be in metadata
          balance: balance,
        };
      } catch (error) {
        // If it's not a valid account address, treat as symbol
        return {
          id: tokenId,
          symbol: tokenId.slice(0, 6).toUpperCase(),
          name: `${tokenId} Token`,
          decimals: 9,
          balance: 0n,
        };
      }
    } catch (error) {
      console.error('❌ [CLIENT] Failed to get token info:', error);
      // Return fallback info
      return {
        id: tokenId,
        symbol: tokenId.slice(0, 6).toUpperCase(),
        name: `Token ${tokenId.slice(0, 8)}`,
        decimals: 9,
        balance: 0n,
      };
    }
  }

  /**
   * Check if a token actually exists on the blockchain
   */
  async tokenExists(tokenId: TokenId): Promise<boolean> {
    try {
      // If it's just a symbol (like 'DEMO'), it's not a real token address
      if (tokenId.length < 20) {
        console.log(`🪙 [CLIENT] ${tokenId} is just a symbol, not a real token`);
        return false;
      }

      // Try to query the token account from blockchain
      const tokenAccount = KeetaNet.lib.Account.fromPublicKeyString(tokenId);
      const state = await this.client.state({ account: tokenAccount });
      
      console.log(`✅ [CLIENT] ${tokenId} exists on blockchain`);
      return true;
    } catch (error) {
      console.log(`❌ [CLIENT] ${tokenId} does not exist on blockchain`);
      return false;
    }
  }

  /**
   * Discover REAL tokens that actually exist on blockchain
   */
  async getAvailableTokens(): Promise<TokenInfo[]> {
    try {
      console.log('🪙 [CLIENT] Discovering REAL tokens on blockchain...');
      
      const tokens: TokenInfo[] = [];
      
      // Always add KTA (base token)
      const ktaInfo = await this.getTokenInfo('KTA');
      tokens.push(ktaInfo);
      
      // Check if we have any real tokens created (like from create-token.js)
      // In a real implementation, this would:
      // 1. Scan recent token creation transactions
      // 2. Query a token registry
      // 3. Check user's wallet for token balances
      
      // Real tokens created on testnet
      const candidateTokens = [
        'keeta_aogptm4ueeu23bu7wp3qmjulaicqqrw7fxuir4nxgjczjnwz3kplf2lw7vyfo', // APPLE
        'keeta_ap23whwndh3pakgqgd7arjigxchdooybu6rkrjhpf67hcdsbnu4q7egv25qyu', // BANANA
        'keeta_amdjie4di55jfnbh7vhsiophjo27dwv5s4qd5qf7p3q7rppgwbwowwjw6zsfs', // LP Token from our pool
      ];
      
      for (const tokenId of candidateTokens) {
        const exists = await this.tokenExists(tokenId);
        if (exists) {
          const tokenInfo = await this.getTokenInfo(tokenId);
          tokens.push(tokenInfo);
        }
      }
      
      console.log(`✅ [CLIENT] Found ${tokens.length} REAL tokens on blockchain`);
      console.log('🪙 [CLIENT] Real tokens:', tokens.map(t => `${t.symbol} (${t.id})`));
      
      return tokens;
    } catch (error) {
      console.error('❌ [CLIENT] Failed to discover real tokens:', error);
      
      // Fallback to just KTA
      return [
        {
          id: 'KTA',
          symbol: 'KTA',
          name: 'Keeta Token',
          decimals: 9,
        }
      ];
    }
  }

  /**
   * Resolve token symbol to actual token account address
   */
  async resolveTokenAddress(tokenSymbolOrAddress: string): Promise<KeetaNet.lib.Account> {
    console.log('🔍 [CLIENT] Resolving token:', tokenSymbolOrAddress);
    
    // If it's already a valid Keeta address, use it directly
    if (tokenSymbolOrAddress.startsWith('keeta_')) {
      try {
        const account = KeetaNet.lib.Account.fromPublicKeyString(tokenSymbolOrAddress);
        console.log('✅ [CLIENT] Using direct address:', tokenSymbolOrAddress);
        return account;
      } catch (error) {
        throw new KSwapError(
          KSwapErrorCode.TOKEN_NOT_FOUND,
          `Invalid token address: ${tokenSymbolOrAddress}`
        );
      }
    }
    
    // Handle known symbols
    switch (tokenSymbolOrAddress.toUpperCase()) {
      case 'KTA':
        console.log('✅ [CLIENT] Resolved KTA to base token');
        return this.client.baseToken;
        
      case 'APPLE':
        const appleAddress = 'keeta_aogptm4ueeu23bu7wp3qmjulaicqqrw7fxuir4nxgjczjnwz3kplf2lw7vyfo';
        console.log('✅ [CLIENT] Resolved APPLE to:', appleAddress);
        return KeetaNet.lib.Account.fromPublicKeyString(appleAddress);
        
      case 'BANANA':
        const bananaAddress = 'keeta_ap23whwndh3pakgqgd7arjigxchdooybu6rkrjhpf67hcdsbnu4q7egv25qyu';
        console.log('✅ [CLIENT] Resolved BANANA to:', bananaAddress);
        return KeetaNet.lib.Account.fromPublicKeyString(bananaAddress);
        
      default:
        throw new KSwapError(
          KSwapErrorCode.TOKEN_NOT_FOUND,
          `Unknown token symbol: ${tokenSymbolOrAddress}`
        );
    }
  }

  /**
   * Preview a transaction before publishing
   * Step 6 from the implementation guide
   */
  async previewTransaction(builder: KeetaNet.Builder) {
    return await this.client.computeBuilderBlocks(builder);
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      ...this.network,
      connected: true,
      userAddress: this.signer.publicKeyString.get(),
    };
  }

  /**
   * Helper method to calculate add liquidity amounts
   */
  private async calculateAddLiquidityAmounts(
    pool: Pool,
    desiredAmountA: bigint,
    desiredAmountB: bigint
  ): Promise<{ optimalAmountA: bigint; optimalAmountB: bigint; lpTokensToMint: bigint }> {
    if (pool.reserveA === 0n && pool.reserveB === 0n) {
      // First liquidity addition
      const lpTokensToMint = this.sqrt(desiredAmountA * desiredAmountB);
      return {
        optimalAmountA: desiredAmountA,
        optimalAmountB: desiredAmountB,
        lpTokensToMint,
      };
    }

    // Calculate optimal amounts to maintain price ratio
    const amountBOptimal = (desiredAmountA * pool.reserveB) / pool.reserveA;
    
    if (amountBOptimal <= desiredAmountB) {
      const lpTokensToMint = (desiredAmountA * pool.totalLpSupply) / pool.reserveA;
      return {
        optimalAmountA: desiredAmountA,
        optimalAmountB: amountBOptimal,
        lpTokensToMint,
      };
    } else {
      const amountAOptimal = (desiredAmountB * pool.reserveA) / pool.reserveB;
      const lpTokensToMint = (desiredAmountB * pool.totalLpSupply) / pool.reserveB;
      return {
        optimalAmountA: amountAOptimal,
        optimalAmountB: desiredAmountB,
        lpTokensToMint,
      };
    }
  }

  /**
   * Integer square root for bigint
   */
  private sqrt(x: bigint): bigint {
    if (x <= 0n) return 0n;
    let z = (x + 1n) / 2n;
    let y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2n;
    }
    return y;
  }
}
