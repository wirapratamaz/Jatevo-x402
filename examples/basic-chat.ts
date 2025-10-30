import 'dotenv/config';
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Basic Chat Example
 * 
 * This example demonstrates how to make a simple chat completion request
 * to the JATEVO x402 AI Inference API using the Qwen model.
 */

async function basicChat() {
  // Configure your account with private key from environment
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // Create wallet client with proper chain configuration
  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: baseSepolia,
  });

  // Create axios client with x402 payment interceptor
  const client = withPaymentInterceptor(
    axios.create({ baseURL: 'https://jatevo.ai' }),
    walletClient
  );

  console.log('🚀 Sending chat request to Qwen 3 Coder 480B...\n');

  try {
    const response = await client.post('/api/x402/llm/qwen', {
      messages: [
        { 
          role: 'user', 
          content: 'Explain quantum computing in simple terms, under 100 words' 
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    });

    const data = response.data;

    console.log('✅ Response received!\n');
    console.log('Model:', data.model);
    console.log('Response:', data.choices[0].message.content);
    console.log('\n📊 Usage:');
    console.log('  - Prompt tokens:', data.usage.prompt_tokens);
    console.log('  - Completion tokens:', data.usage.completion_tokens);
    console.log('  - Total tokens:', data.usage.total_tokens);
    console.log('\n💰 Cost: $0.01 USDC');
    console.log('✓ Payment verified via x402');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Run the example
basicChat().catch(console.error);
