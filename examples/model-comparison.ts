import 'dotenv/config';
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Model Comparison Example
 * 
 * This example demonstrates how to compare responses from different models
 * for the same prompt by querying them individually.
 */

async function compareModels() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  const client = withPaymentInterceptor(
    axios.create({ baseURL: 'https://jatevo.ai' }),
    account
  );

  const prompt = 'Write a haiku about artificial intelligence';

  // Models to compare
  const models = [
    { name: 'Qwen 3 Coder 480B', endpoint: 'qwen' },
    { name: 'DeepSeek R1', endpoint: 'deepseek-r1-0528' },
    { name: 'Kimi K2', endpoint: 'kimi' }
  ];

  console.log('🚀 Comparing 3 models for the same prompt...');
  console.log('Prompt:', prompt, '\n');
  console.log('='.repeat(80));

  const results = [];

  for (const model of models) {
    console.log(`\n📦 Querying ${model.name}...`);
    
    try {
      const startTime = Date.now();
      
      const response = await client.post(`/api/x402/llm/${model.endpoint}`, {
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 100,
        stream: false
      });

      const data = response.data;
      const duration = Date.now() - startTime;

      results.push({
        name: model.name,
        content: data.choices[0].message.content,
        tokens: data.usage.total_tokens,
        duration
      });

      console.log('✓ Response received in', duration, 'ms');

    } catch (error: any) {
      console.error(`✗ Error with ${model.name}:`, error.response?.data || error.message);
    }
  }

  // Display comparison
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 COMPARISON RESULTS\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   Response: ${result.content}`);
    console.log(`   Tokens: ${result.tokens} | Duration: ${result.duration}ms`);
    console.log('');
  });

  console.log('💰 Total Cost: $' + (results.length * 0.01).toFixed(2), 'USDC');
  console.log('\n✓ All responses paid via x402');
}

// Run the example
compareModels().catch(console.error);
