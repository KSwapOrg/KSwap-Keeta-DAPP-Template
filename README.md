# Keeta DApp Template

A complete starter template for building decentralized applications on the Keeta Network. Includes a production-ready wallet extension and frontend components extracted from KSwap.

## What's Included

### 1. Wallet Extension (`wallet-extension/`)
Complete Chrome extension for Keeta Network wallet management:
- 12-word seed phrase backup and recovery
- Multi-wallet support
- Real KTA token transactions
- Network switching (testnet/mainnet)
- Seed phrase import/export
- Dark/light themes with Keeta brand colors

**Version**: 2.0.2  
**Source**: Extracted from [KSwapExtension](https://github.com/KSwapOrg/KSwapExtension)

### 2. DApp Frontend (`dapp-frontend/`)
Reusable React components for wallet integration:
- `WalletConnector.tsx` - Wallet connection UI component
- `TokenSelector.tsx` - Token selection interface
- `Header.tsx` - DApp header with wallet status
- `keeta-dapp-client.ts` - Keeta Network client library
- `types.ts` - TypeScript type definitions

**Source**: Extracted from [KSwap DEX](https://github.com/KSwapOrg/KSwap)

### 3. Examples (`examples/`)
Sample integrations showing how to use the template

### 4. Documentation (`docs/`)
Integration guides and API reference

## Quick Start

### Install Wallet Extension

1. Navigate to wallet extension:
```bash
cd wallet-extension
npm install
./build.sh
```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `wallet-extension/build` directory

### Create Your DApp

1. Copy the frontend template:
```bash
cp -r dapp-frontend my-keeta-dapp
cd my-keeta-dapp
npm install
```

2. Start development:
```bash
npm run dev
```

3. Your DApp will have access to `window.keeta` provider

## DApp Integration Example

```typescript
import { WalletConnector } from './components/WalletConnector';
import { TokenSelector } from './components/TokenSelector';

function MyDApp() {
  const [wallet, setWallet] = useState(null);
  
  // Connect to wallet
  const connect = async () => {
    if (window.keeta) {
      const accounts = await window.keeta.connect();
      setWallet(accounts[0]);
    }
  };
  
  return (
    <div>
      <WalletConnector onConnect={connect} />
      {wallet && <TokenSelector wallet={wallet} />}
    </div>
  );
}
```

## Architecture

### Wallet Extension (Provider)
- Manages private keys and accounts
- Signs transactions
- Injects `window.keeta` into web pages
- Handles network connections

### DApp Frontend (Consumer)
- Connects to `window.keeta`
- Displays wallet status
- Sends transaction requests
- Listens for wallet events

### Communication Flow

```
DApp Frontend → window.keeta → Extension → Keeta Network
                      ↑              ↓
                      └── Events ────┘
```

## API Reference

### window.keeta Provider

```typescript
interface KeetaProvider {
  isKeeta: boolean;
  connect(): Promise<string[]>;
  getAccount(): Promise<string>;
  getBalance(tokenId: string): Promise<bigint>;
  sendTransaction(to: string, amount: bigint, tokenId: string): Promise<string>;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

### Events

1. `accountChanged` - Fired when user switches accounts
2. `networkChanged` - Fired when user switches networks
3. `disconnect` - Fired when wallet disconnects

## Customization

### Branding
Update these files for your DApp branding:
1. `wallet-extension/icons/` - Replace with your icons
2. `wallet-extension/manifest.json` - Update name and description
3. `dapp-frontend/components/Header.tsx` - Customize header

### Network Configuration
Edit `wallet-extension/src/lib/wallet-client-real.js`:
```javascript
const NETWORK_CONFIGS = {
  testnet: { ... },
  mainnet: { ... }
};
```

## Production Deployment

### Wallet Extension

1. Build production package:
```bash
cd wallet-extension
./build.sh
cd build && zip -r ../extension.zip . && cd ..
```

2. Upload `extension.zip` to Chrome Web Store

### DApp Frontend

1. Build for production:
```bash
cd dapp-frontend
npm run build
```

2. Deploy to hosting (Vercel, Netlify, etc.)

## Example DApps

Check the `examples/` directory for:
1. **Basic Token Transfer** - Simple send/receive interface
2. **Token Swap** - DEX-style swap interface
3. **NFT Minting** - Create and manage NFTs
4. **DAO Voting** - Governance and voting

## Requirements

### Wallet Extension
- Chrome/Edge browser
- No external dependencies

### DApp Frontend
- Node.js 18+
- React 18+
- TypeScript 5+

## License

Business Source License 1.1 (BSL)
- Non-commercial use permitted
- Use on Keeta Network permitted
- Converts to MIT after 2 years

See LICENSE file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/KSwapOrg/KeetaDappTemplate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/KSwapOrg/KeetaDappTemplate/discussions)
- **Discord**: KSwap Community Server

## Credits

Built by [KSwap Organization](https://github.com/KSwapOrg)
- Wallet Extension: Based on KSwapExtension
- DApp Components: Extracted from KSwap DEX
- Network: Powered by Keeta Network

---

**Get started building on Keeta in minutes!** 🚀

