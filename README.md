# JATEVO x402 AI Inference API

JATEVO's x402-powered AI inference API enables pay-per-use access to state-of-the-art large language models without API keys, subscriptions, or account management. Now with dual-network support for both Base and Solana blockchains.

**Live API**: `https://jatevo.ai`

> **Note**: Replace with your actual deployment URL when self-hosting

## What is x402?

x402 is an open payment standard that enables services to charge for access to their APIs using the `402 Payment Required` HTTP status code. It allows clients to programmatically pay for resources without accounts or credentials, using crypto-native payments for speed, privacy, and efficiency.

For more detailed information about x402, visit the [official documentation](https://x402.gitbook.io/x402).

## Features

- **No API Keys** - Your wallet address is your authentication
- **Pay Per Use** - Only pay for what you actually use
- **Dual Network Support** - Choose between Base (L2 EVM) or Solana for payments
- **Instant Settlement** - Payments verified in ~200ms on Base, ~2s on Solana
- **Multiple Models** - Access to 6+ state-of-the-art LLMs
- **OpenAI Compatible** - Drop-in replacement for OpenAI API clients
- **Multi-Model Queries** - Query multiple models in parallel with a single request

## Available Models

| Model | Context Window | Pricing |
|-------|----------------|---------|
| **Qwen 3 Coder 480B** | 128K tokens | $0.01 USDC per request |
| **GLM 4.5** | 128K tokens | $0.01 USDC per request |
| **Kimi K2 Instruct** | 200K tokens | $0.01 USDC per request |
| **DeepSeek R1 0528** | 64K tokens | $0.01 USDC per request |
| **DeepSeek V3.1** | 128K tokens | $0.01 USDC per request |
| **GPT-OSS 120B** | 32K tokens | $0.01 USDC per request |

## Network Support

### Base Network (Default)
- **Network**: Base mainnet (Ethereum L2)
- **Token**: USDC (0x833589fcd6edb6e08f4c7c32d4f71b54bda02913)
- **Speed**: ~200ms verification
- **Gas**: Low cost (~$0.001 per transaction)

### Solana Network
- **Network**: Solana mainnet
- **Token**: USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- **Speed**: ~2s verification
- **Gas**: Ultra-low cost (~$0.00025 per transaction)

## Quick Start

### Installation

```bash
# Option 1: Simple Base-only implementation (recommended for Base network)
npm install x402-axios axios viem

# Option 2: Full SDK with dual-network support
npm install jatevo-x402-sdk
```

### Basic Usage (Simple x402-axios for Base Network)

```javascript
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';

// Configure your account with private key
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');

// Create axios client with x402 payment interceptor
const client = withPaymentInterceptor(
  axios.create({ baseURL: 'https://jatevo.ai' }),
  account
);

// Make a request to any LLM endpoint
const response = await client.post('/api/x402/llm/qwen', {
  messages: [
    { role: 'user', content: 'Explain quantum computing in simple terms' }
  ],
  temperature: 0.7,
  max_tokens: 2048,
  stream: false
});

console.log(response.data.choices[0].message.content);
```

### Base Network Usage (Using SDK)

```javascript
import { X402Client } from 'jatevo-x402-sdk';

// Configure for Base network with private key
const client = new X402Client({
  baseUrl: 'https://jatevo.ai',
  network: 'base', // or 'base-testnet' for testnet
  privateKey: '0xYOUR_PRIVATE_KEY', // Your Base wallet private key
  debug: true
});

// Make a request to any LLM endpoint
const response = await client.chat('qwen', 'Explain quantum computing in simple terms');
console.log(response);
```

### Solana Network Usage (Server-side)

```javascript
import { X402Client } from 'jatevo-x402-sdk';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

// Load Solana keypair from file
const secretKey = JSON.parse(fs.readFileSync('./solana-keypair.json', 'utf-8'));
const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Configure for Solana network
const client = new X402Client({
  baseUrl: 'https://jatevo.ai',
  network: 'solana', // or 'solana-devnet' for devnet
  solanaWallet: keypair,
  debug: true
});

// Make a request (payment will be handled automatically)
const response = await client.chat('deepseek-v3.1', 'What is the future of AI?');
console.log(response);
```

### Advanced: Network Selection

```javascript
import { X402Client } from 'jatevo-x402-sdk';

const client = new X402Client({
  baseUrl: 'https://jatevo.ai',
  debug: true
});

// Check available networks from 402 response
try {
  await client.chat('qwen', 'Hello');
} catch (error) {
  if (error.response?.status === 402) {
    const networks = error.response.data.paymentOptions;
    console.log('Available networks:', networks);
    
    // User can choose their preferred network
    if (networks.includes('solana')) {
      client.switchNetwork('solana');
      await client.connectWallet(); // Connect Phantom/Solflare
    } else {
      client.switchNetwork('base');
      // Configure with private key or connect MetaMask
    }
  }
}
```

## API Endpoints

### Single Model Endpoints

Query individual models with optimized performance:

- `POST /api/x402/llm/qwen` - Qwen 3 Coder 480B
- `POST /api/x402/llm/glm` - GLM 4.5
- `POST /api/x402/llm/kimi` - Kimi K2 Instruct
- `POST /api/x402/llm/deepseek-r1-0528` - DeepSeek R1 0528
- `POST /api/x402/llm/deepseek-v3.1` - DeepSeek V3.1
- `POST /api/x402/llm/gpt-oss` - GPT-OSS 120B

### Multi-Model Endpoint

Query all 6 models in parallel and get aggregated results:

- `POST /api/x402/multi` - Query all models simultaneously ($0.06 USDC)

### Request Format

All endpoints accept OpenAI-compatible request format:

```typescript
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Your question here" }
  ],
  "temperature": 0.7,      // Optional: 0.0 to 2.0 (default: 0.7)
  "max_tokens": 2048,      // Optional: max tokens to generate (default: 2048)
  "stream": false,         // Optional: streaming not currently supported
  "network": "solana"      // Optional: preferred payment network (base/solana)
}
```

### Response Format

OpenAI-compatible response format:

```typescript
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "qwen-3-coder-480b",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Response text..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  }
}
```

### 402 Payment Response

When payment is required, the API returns:

```typescript
{
  "status": 402,
  "headers": {
    "X-Address": "Payment recipient address",
    "X-PRICE": "0.01 USDC",
    "X-Currency": "USDC",
    "X-Token-Address": "USDC contract address"
  },
  "paymentOptions": ["base", "solana"], // Available networks
  "paymentDetails": {
    "base": {
      "network": "base",
      "address": "0x...",
      "token": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      "amount": "10000" // 0.01 USDC (6 decimals)
    },
    "solana": {
      "network": "solana",
      "address": "...",
      "token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount": "10000" // 0.01 USDC (6 decimals)
    }
  }
}
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [basic-chat.ts](./examples/basic-chat.ts) - Simple chat completion with Base network
- [solana-browser.html](./examples/solana-browser.html) - Browser-based Solana wallet integration
- [multi-network.ts](./examples/multi-network.ts) - Dynamic network selection
- [model-comparison.ts](./examples/model-comparison.ts) - Compare responses across models
- [multi-model.ts](./examples/multi-model.ts) - Query all models in parallel

## Development

### Testing Networks

- **Base Testnet**: Use Base Sepolia testnet USDC for development
- **Solana Devnet**: Use Solana devnet USDC for testing

### Environment Variables

```env
# For Base network
BASE_PRIVATE_KEY=0x...
BASE_RPC_URL=https://mainnet.base.org

# For Solana network  
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Migration Guide

### Upgrading from v1.0.0 to v1.1.0

The SDK now supports dual networks. Key changes:

1. **Network Configuration**: Specify network in client config
   ```javascript
   // Old (v1.0.0 - Base only)
   const client = new X402Client({ privateKey: '0x...' });
   
   // New (v1.1.0 - Choose network)
   const client = new X402Client({ 
     network: 'solana', // or 'base'
     privateKey: '0x...' // for Base
   });
   ```

2. **Browser Wallet Support**: Connect wallets for browser environments
   ```javascript
   // New in v1.1.0
   await client.connectWallet(); // Connects Phantom for Solana, MetaMask for Base
   ```

3. **Network Switching**: Dynamically change networks
   ```javascript
   // New in v1.1.0
   client.switchNetwork('solana');
   ```

## Security

- Never expose private keys in frontend code
- Use environment variables for sensitive data
- Validate all payment amounts before signing
- Keep dependencies updated

## Support

- **Documentation**: [Full API Reference](./docs/API_REFERENCE.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/x402-api/issues)
- **Discord**: [Join our community](https://discord.gg/jatevo)

## License

MIT License - see [LICENSE](./LICENSE) file

---

Built with ❤️ by JATEVO Team