# JATEVO x402 AI Inference API

JATEVO's x402-powered AI inference API enables pay-per-use access to state-of-the-art large language models without API keys, subscriptions, or account management.

**Live API**: `https://jatevo.ai`

> **Note**: Replace with your actual deployment URL when self-hosting

## What is x402?

x402 is an open payment standard that enables services to charge for access to their APIs using the `402 Payment Required` HTTP status code. It allows clients to programmatically pay for resources without accounts or credentials, using crypto-native payments for speed, privacy, and efficiency.

For more detailed information about x402, visit the [official documentation](https://x402.gitbook.io/x402).

## Features

- **No API Keys** - Your wallet address is your authentication
- **Pay Per Use** - Only pay for what you actually use
- **Instant Settlement** - Payments verified in ~200ms on Base network
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

## Quick Start

### Installation

```bash
npm install x402-fetch
# or
pnpm install x402-fetch
```

### Basic Usage

```typescript
import { x402Fetch } from 'x402-fetch';

// Configure x402-enabled fetch
const fetch = x402Fetch({
  privateKey: process.env.PRIVATE_KEY, // Your Ethereum private key
  network: 'base' // Base network for fast, cheap payments
});

// Make a request to any LLM endpoint
const response = await fetch('https://jatevo.ai/api/x402/llm/qwen', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ],
    temperature: 0.7,
    max_tokens: 2048
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
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
  "stream": false          // Optional: streaming not currently supported
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
    "prompt_tokens": 20,
    "completion_tokens": 150,
    "total_tokens": 170
  },
  "provider": "x402-jatevo-LLM-inference"
}
```

## Payment Flow

1. **Initial Request**: Client sends a request without payment information
2. **Payment Required**: Server responds with `402 Payment Required` and payment instructions
3. **Automatic Payment**: `x402-fetch` automatically handles the payment using your private key
4. **Verification**: Server verifies payment on Base network (~200ms)
5. **API Call**: Server processes your request and calls the LLM provider
6. **Response**: Server returns the model's response with transaction details

## Environment Setup

Create a `.env` file with your Ethereum private key:

```bash
PRIVATE_KEY=0x...
```

**Security Note**: Keep your private key secure and never commit it to version control. The private key should have some ETH on Base network for gas fees and USDC for payments.

## Examples

See the [examples](./examples) directory for complete working implementations:

- [basic-chat.ts](./examples/basic-chat.ts) - Simple chat completion
- [multi-model.ts](./examples/multi-model.ts) - Query multiple models in parallel
- [with-context.ts](./examples/with-context.ts) - Multi-turn conversation with context
- [model-comparison.ts](./examples/model-comparison.ts) - Compare responses across models

## API Reference

For detailed API documentation including all parameters, response schemas, and error codes, see [API_REFERENCE.md](./docs/API_REFERENCE.md).

## Model Comparison

For a detailed comparison of model capabilities, performance, and pricing, see [MODELS.md](./docs/MODELS.md).

## Pricing

All single-model endpoints: **$0.01 USDC per request**

Multi-model endpoint: **$0.06 USDC per request** (queries all 6 models in parallel)

Payments are made in USDC on the Base network for fast settlement and low gas fees.

## Rate Limits

- No rate limits - pay-per-use model
- No daily quotas or usage caps
- Scale as needed with instant payments

## Support

For issues, questions, or feature requests:

- GitHub Issues: [Create an issue](https://github.com/yourusername/x402-api/issues)
- Email: support@jatevo.ai
- Documentation: [Full API Reference](./docs/API_REFERENCE.md)

## License

MIT License - see [LICENSE](./LICENSE) for details

## About JATEVO

JATEVO is an innovative AI inference platform empowering developers and startups with high-performance, scalable model hosting across global markets. Learn more at [jatevo.ai](https://jatevo.ai).
