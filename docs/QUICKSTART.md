# Quick Start Guide

Get started with JATEVO x402 AI Inference API in under 5 minutes.

## Prerequisites

- Node.js 18+ or Python 3.8+
- Ethereum wallet with:
  - Some ETH on Base network (for gas fees, ~$0.50)
  - USDC on Base network (for payments)
- Your wallet's private key

## Step 1: Get Your Wallet Ready

### Option A: Use an Existing Wallet

Export your private key from MetaMask or another wallet:
1. Open MetaMask
2. Click account menu → Account Details
3. Export Private Key (requires password)

### Option B: Create a New Wallet

```bash
# Using ethers.js
npx ethers-cli create-wallet

# Or use any Ethereum wallet tool
```

### Add Funds to Base Network

1. Bridge ETH to Base: https://bridge.base.org
2. Swap some ETH for USDC on Base (use Uniswap or similar)

Recommended minimum:
- 0.01 ETH (~$20) for gas
- 1 USDC for testing (~100 requests)

## Step 2: Install Dependencies

### JavaScript/TypeScript

```bash
npm install x402-axios axios viem dotenv
# or
pnpm install x402-axios axios viem dotenv
```

### Python (coming soon)

```bash
pip install x402-python
```

## Step 3: Set Up Environment

Create a `.env` file:

```bash
PRIVATE_KEY=0x...  # Your wallet private key
```

⚠️ **Security**: Never commit `.env` to git. Add it to `.gitignore`.

## Step 4: Make Your First Request

### JavaScript/TypeScript

Create `test.ts`:

```typescript
import 'dotenv/config';
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const client = withPaymentInterceptor(
  axios.create({ baseURL: 'https://jatevo.ai' }),
  account
);

async function main() {
  const response = await client.post('/api/x402/llm/qwen', {
    messages: [
      { role: 'user', content: 'Say hello!' }
    ],
    stream: false
  });

  console.log(response.data.choices[0].message.content);
}

main();
```

Run it:

```bash
npx tsx test.ts
```

## Step 5: Understanding the Response

You'll get an OpenAI-compatible response:

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "qwen-3-coder-480b",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 12,
    "total_tokens": 22
  }
}
```

The payment happened automatically via x402! Check the transaction on Base: https://basescan.org

## Common Patterns

### Pattern 1: Ask a Question

```typescript
const response = await client.post('/api/x402/llm/glm', {
  messages: [
    { role: 'user', content: 'What is quantum computing?' }
  ],
  temperature: 0.7,
  max_tokens: 500,
  stream: false
});
```

### Pattern 2: Generate Code

```typescript
const response = await client.post('/api/x402/llm/qwen', {  // Best for code
  messages: [
    { role: 'user', content: 'Write a binary search in Python' }
  ],
  temperature: 0.3,  // Lower for more deterministic code
  max_tokens: 1000,
  stream: false
});
```

### Pattern 3: Multi-Turn Conversation

```typescript
const conversation = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'What is TypeScript?' }
];

// First exchange
let response = await client.post('/api/x402/llm/glm', {
  messages: conversation,
  stream: false
});

let data = response.data;
conversation.push({
  role: 'assistant',
  content: data.choices[0].message.content
});

// Continue conversation
conversation.push({
  role: 'user',
  content: 'How is it different from JavaScript?'
});

response = await client.post('/api/x402/llm/glm', {
  messages: conversation,
  stream: false
});
```

### Pattern 4: Compare Multiple Models

```typescript
const response = await client.post('/api/x402/multi', {
  messages: [{ role: 'user', content: 'Explain blockchain' }],
  stream: false
});

const data = response.data;
data.models.forEach((model: any) => {
  console.log(`${model.name}: ${model.content}`);
});
```

## Choosing the Right Model

Quick reference:

- **Coding?** Use `/api/x402/llm/qwen`
- **Long documents?** Use `/api/x402/llm/kimi` (200K context)
- **Math/reasoning?** Use `/api/x402/llm/deepseek-r1-0528`
- **Multilingual?** Use `/api/x402/llm/glm`
- **Production/general?** Use `/api/x402/llm/deepseek-v3.1`
- **Fast/simple?** Use `/api/x402/llm/gpt-oss`
- **Compare all?** Use `/api/x402/multi`

See [MODELS.md](./MODELS.md) for detailed comparison.

## Monitoring Costs

Each request costs $0.01 USDC (multi-model costs $0.06).

Track your spending:

```typescript
let requestCount = 0;

async function makeRequest(messages: any[]) {
  const response = await fetch(API_URL, { ... });
  requestCount++;
  console.log(`Requests: ${requestCount}, Cost: $${requestCount * 0.01}`);
  return response;
}
```

## Troubleshooting

### Error: "Insufficient funds"

- Add more USDC to your wallet on Base network
- Ensure you have ETH for gas fees

### Error: "Invalid private key"

- Check your `.env` file
- Ensure private key starts with `0x`
- Use a fresh private key (not your main wallet for security)

### Error: "Network error"

- Check your internet connection
- Verify the API URL is correct
- Try again (transient network issues)

### Slow responses

- Normal latency: 1-3 seconds
- If consistently slow, try a different model
- GPT-OSS and Kimi are fastest

## Next Steps

1. **Explore Examples**: Check the [examples](../examples) folder
2. **Read API Docs**: See [API_REFERENCE.md](./API_REFERENCE.md)
3. **Compare Models**: Review [MODELS.md](./MODELS.md)
4. **Build Something**: Start integrating into your app!

## Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/x402-api/issues)
- **Email**: support@jatevo.ai
- **Docs**: [Full documentation](../README.md)

## Security Best Practices

1. ✅ Use a dedicated wallet for API payments (not your main wallet)
2. ✅ Keep minimal funds in the wallet (just what you need)
3. ✅ Never commit `.env` files to version control
4. ✅ Rotate private keys periodically
5. ✅ Monitor wallet activity on BaseScan

Happy building! 🚀
