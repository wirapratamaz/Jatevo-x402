# API Reference

Complete API reference for JATEVO x402 AI Inference API.

## Base URL

```
https://jatevo.ai
```

## Authentication

No API keys or authentication headers required. Your Ethereum wallet address serves as your identity, and payments are verified on-chain via the x402 protocol.

## Payment

All endpoints use x402 micropayments:
- Network: Base (Ethereum L2)
- Payment Token: USDC
- Settlement Time: ~200ms
- Gas Fees: <$0.01 (Base network)

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Accept` | Yes | Must be `application/json` |

## Common Request Parameters

All LLM endpoints accept the following parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `messages` | array | Yes | - | Array of message objects with `role` and `content` |
| `temperature` | number | No | 0.7 | Controls randomness (0.0-2.0). Lower = more deterministic |
| `max_tokens` | number | No | 2048 | Maximum tokens to generate |
| `stream` | boolean | No | false | Enable streaming responses (not yet supported) |

### Message Format

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### Example Request Body

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Explain quantum computing" }
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## Common Response Format

All endpoints return OpenAI-compatible responses:

```typescript
interface ChatCompletion {
  id: string;                    // Unique completion ID
  object: 'chat.completion';
  created: number;               // Unix timestamp
  model: string;                 // Model identifier
  choices: [{
    index: number;
    message: {
      role: 'assistant';
      content: string;           // Generated response
    };
    finish_reason: 'stop' | 'length' | 'error';
  }];
  usage: {
    prompt_tokens: number;       // Input tokens
    completion_tokens: number;   // Generated tokens
    total_tokens: number;        // Sum of prompt + completion
  };
  provider: string;              // "x402-jatevo-LLM-inference"
  x402_model?: string;           // Internal model identifier
}
```

## Endpoints

### Single Model Endpoints

#### POST /api/x402/llm/qwen

Query Qwen 3 Coder 480B model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 128K tokens
- Best For: Code generation, technical writing, reasoning

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/qwen \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Write a quicksort in Python"}],
    "temperature": 0.3,
    "max_tokens": 1000
  }'
```

---

#### POST /api/x402/llm/glm

Query GLM 4.5 model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 128K tokens
- Best For: General conversation, creative writing, multilingual tasks

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/glm \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Translate to Spanish: Hello world"}],
    "temperature": 0.5
  }'
```

---

#### POST /api/x402/llm/kimi

Query Kimi K2 Instruct model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 200K tokens
- Best For: Long-context tasks, document analysis, research

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/kimi \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Summarize this document: [long text]"}],
    "max_tokens": 500
  }'
```

---

#### POST /api/x402/llm/deepseek-r1-0528

Query DeepSeek R1 0528 model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 64K tokens
- Best For: Advanced reasoning, mathematics, problem-solving

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/deepseek-r1-0528 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Solve: What is the derivative of x^3 + 2x^2 - 5x + 1?"}],
    "temperature": 0.1
  }'
```

---

#### POST /api/x402/llm/deepseek-v3.1

Query DeepSeek V3.1 model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 128K tokens
- Best For: High-performance general purpose, coding, analysis

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/deepseek-v3.1 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain neural networks"}],
    "temperature": 0.7,
    "max_tokens": 800
  }'
```

---

#### POST /api/x402/llm/gpt-oss

Query GPT-OSS 120B model.

**Pricing:** $0.01 USDC per request

**Model Specs:**
- Context Window: 32K tokens
- Best For: Fast inference, general conversation, content generation

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/llm/gpt-oss \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Write a product description for a smartwatch"}]
  }'
```

---

### Multi-Model Endpoint

#### POST /api/x402/multi

Query all 6 models in parallel and receive aggregated results.

**Pricing:** $0.06 USDC per request (6 models × $0.01)

**Response Format:**

```typescript
interface MultiModelResponse {
  models: Array<{
    name: string;              // Model name (qwen, glm, kimi, etc.)
    provider: string;          // Provider name
    model_id: string;          // Full model identifier
    content: string;           // Model's response
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    duration_ms: number;       // Response time in milliseconds
    success: boolean;          // Whether model succeeded
    error?: string;            // Error message if failed
  }>;
  summary: {
    total_models: number;      // Number of models queried
    successful: number;        // Number that succeeded
    failed: number;            // Number that failed
    total_tokens: number;      // Sum of all tokens
    average_duration_ms: number;
    fastest_model: string;
    slowest_model: string;
  };
  request_id: string;
  timestamp: number;
}
```

**Example:**

```bash
curl -X POST https://jatevo.ai/api/x402/multi \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "temperature": 0.3,
    "max_tokens": 100
  }'
```

**Use Case:**
Perfect for:
- A/B testing model responses
- Ensemble approaches
- Model quality comparison
- Redundancy and reliability

---

## Error Responses

### 400 Bad Request

Invalid request format or parameters.

```json
{
  "error": "Invalid request",
  "details": "Messages array is required"
}
```

### 402 Payment Required

x402 payment verification failed or insufficient funds.

```json
{
  "error": "Payment required",
  "details": "x402 payment verification failed",
  "payment_info": {
    "amount": "0.01",
    "currency": "USDC",
    "network": "base",
    "recipient": "0x..."
  }
}
```

### 500 Internal Server Error

Model provider error or server issue.

```json
{
  "error": "Failed to process query",
  "details": "Model provider returned an error"
}
```

### 503 Service Unavailable

Model provider temporarily unavailable.

```json
{
  "error": "Service temporarily unavailable",
  "details": "Please retry in a few moments"
}
```

---

## Rate Limits

**No rate limits** - pay-per-use model with instant settlement via x402.

## Best Practices

### 1. Temperature Selection

- **Creative tasks** (writing, brainstorming): 0.7-1.0
- **Balanced** (general conversation): 0.5-0.7
- **Deterministic** (coding, math): 0.1-0.3

### 2. Token Management

- Set appropriate `max_tokens` to control costs and response length
- For code: 500-2000 tokens
- For explanations: 300-1000 tokens
- For summaries: 100-500 tokens

### 3. Context Window Usage

Monitor token usage to stay within model limits:
- Qwen: 128K tokens
- GLM: 128K tokens
- Kimi: 200K tokens (best for long documents)
- DeepSeek R1: 64K tokens
- DeepSeek V3.1: 128K tokens
- GPT-OSS: 32K tokens

### 4. Model Selection

Choose based on your use case:
- **Coding**: Qwen, DeepSeek V3.1
- **Reasoning**: DeepSeek R1, Qwen
- **Long Context**: Kimi (200K window)
- **Fast Inference**: GPT-OSS
- **Multilingual**: GLM
- **Cost-Effective Testing**: Multi-model endpoint for comparisons

### 5. Error Handling

Always implement retry logic with exponential backoff:

```typescript
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## TypeScript Types

```typescript
// Request types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Response types
interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'error';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider: string;
}
```

---

## Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/x402-api/issues)
- **Email**: support@jatevo.ai
- **Documentation**: [README](../README.md) | [Model Comparison](./MODELS.md)
