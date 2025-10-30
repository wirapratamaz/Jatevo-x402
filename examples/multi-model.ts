import 'dotenv/config';
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Multi-Model Query Example
 * 
 * This example demonstrates how to query all 6 models simultaneously
 * and get aggregated results for comparison.
 */

async function multiModelQuery() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: baseSepolia,
  });

  const client = withPaymentInterceptor(
    axios.create({ baseURL: 'https://jatevo.ai' }),
    walletClient
  );

  const prompt = 'What is the most efficient sorting algorithm and why?';

  console.log('🚀 Querying all 6 models simultaneously...\n');
  console.log('Prompt:', prompt, '\n');

  try {
    const response = await client.post('/api/x402/multi', {
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300,
      stream: false
    });

    const data = response.data;

    console.log('✅ Received responses from all models!\n');
    console.log('='.repeat(80));

    // Display each model's response
    data.models.forEach((modelResult: any, index: number) => {
      console.log(`\n${index + 1}. ${modelResult.model.toUpperCase()}`);
      console.log('-'.repeat(80));
      console.log(modelResult.response.choices[0].message.content);
      console.log('\n📊 Tokens:', modelResult.response.usage.total_tokens);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💰 Total Cost: $0.06 USDC (6 models × $0.01)');
    console.log('✓ All payments verified via x402');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Run the example
multiModelQuery().catch(console.error);
