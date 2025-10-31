# Jatevo x402 LLM API

Pay-per-use AI models via micropayments. No API keys, no subscriptions. Just $0.01 per request.

## What is x402?

x402 is an open payment standard that enables services to charge for API access using the HTTP `402 Payment Required` status code. Instead of managing API keys, subscriptions, or accounts, clients pay for exactly what they use through cryptocurrency micropayments.

**How x402 Works:**
1. **Request** → Your client sends a request to the API
2. **402 Response** → Server returns payment requirements if payment needed
3. **Payment** → Client signs a micropayment authorization (handled by SDK)
4. **Retry** → Request automatically retries with payment proof
5. **Response** → You receive the API response

**Benefits:**
- ✅ **No API Keys** - Your wallet address is your identity
- ✅ **No Subscriptions** - Pay only for what you use
- ✅ **Privacy** - No personal information required
- ✅ **Instant Access** - Start using immediately with USDC
- ✅ **Fair Pricing** - Same price for everyone: $0.01 per request

The x402 protocol uses USDC (a USD stablecoin) for payments, ensuring predictable costs. Payments settle in ~200ms on Base network or ~2s on Solana network.

Learn more about the x402 standard at [x402.gitbook.io](https://x402.gitbook.io/x402)

## Quick Start (Terminal/VSCode)

```bash
npm install jatevo-x402-sdk axios
```

```javascript
const { withPaymentInterceptor } = require('jatevo-x402-sdk');
const axios = require('axios');

// Your private key (keep secure!)
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Create client with payment handler
const client = withPaymentInterceptor(axios.create(), PRIVATE_KEY);

// Call any model
const response = await client.post('https://api.jatevo.ai/chat/completions/qwen', {
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.data.choices[0].message.content);
```

That's it! The SDK handles payments automatically.

## Available Models

All models cost $0.01 USDC per request:

| Model | Best For | Context |
|-------|----------|---------|
| `qwen` | Code generation | 128K |
| `glm` | Advanced reasoning | 128K |
| `kimi` | Long context tasks | 200K |
| `deepseek-r1-0528` | Complex reasoning | 64K |
| `deepseek-v3.1` | General chat | 128K |
| `gpt-oss` | OpenAI compatibility | 32K |

## API Endpoints

Replace `{model}` with any model from the table above:

```
POST https://api.jatevo.ai/chat/completions/{model}
```

## Examples

### Basic Chat
```javascript
const response = await client.post('https://api.jatevo.ai/chat/completions/qwen', {
  messages: [
    { role: 'user', content: 'Explain async/await' }
  ],
  temperature: 0.7,
  max_tokens: 200
});
```

### Code Generation
```javascript
const response = await client.post('https://api.jatevo.ai/chat/completions/qwen', {
  messages: [
    { role: 'system', content: 'You are an expert programmer.' },
    { role: 'user', content: 'Write a React component for a todo list' }
  ]
});
```

### Multi-turn Conversation
```javascript
const messages = [
  { role: 'user', content: 'What is React?' },
  { role: 'assistant', content: 'React is a JavaScript library...' },
  { role: 'user', content: 'Show me a simple example' }
];

const response = await client.post('https://api.jatevo.ai/chat/completions/kimi', {
  messages: messages
});
```

## Setup Requirements

1. **USDC Balance**: You need USDC on Base or Solana
   - Base: Bridge USDC to Base network
   - Solana: Get USDC on Solana mainnet

2. **Private Key**: Export from your wallet
   - MetaMask: Settings → Security → Export Private Key
   - Phantom: Settings → Export Private Key

3. **Environment Variable**: Store securely
```bash
export PRIVATE_KEY="0x..."  # For Base
# or
export PRIVATE_KEY="[...]"  # For Solana (array format)
```

## How It Works

1. You make an API request
2. Server responds with payment request (HTTP 402)
3. SDK signs a micro-payment ($0.01 USDC)
4. Request retries with payment proof
5. You get the AI response

All handled automatically by the SDK!

## Common Issues

### "Payment Required" Error
- Check USDC balance in your wallet
- Ensure private key is correctly set
- Verify you're on the right network

### "Invalid Private Key"
- Base: Should start with `0x`
- Solana: Should be array format `[1,2,3...]`

### Rate Limiting
- Default: 10 requests per minute
- Need more? Contact support

## More Examples

See the [examples](./examples) folder for:
- `basic.js` - Simple chat completion
- `streaming.js` - Streaming responses
- `compare-models.js` - Compare different models

## Advanced Topics

- [Network Selection Guide](./docs/networks.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Integration Guide](./docs/integration.md)

## License

MIT - See [LICENSE](./LICENSE) file
