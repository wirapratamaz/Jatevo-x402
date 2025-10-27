import 'dotenv/config';

/**
 * Multi-Model Query Example
 * 
 * This example demonstrates how to query all 6 LLM models in parallel
 * and compare their responses.
 */

async function multiModelQuery() {
  const { x402Fetch } = await import('x402-fetch');
  
  const fetch = x402Fetch({
    privateKey: process.env.PRIVATE_KEY!,
    network: 'base'
  });

  const question = 'What is the capital of France? Answer in one sentence.';

  console.log('🚀 Querying all 6 models in parallel...');
  console.log('Question:', question, '\n');

  try {
    const response = await fetch('https://jatevo.ai/api/x402/multi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: question }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    });

    const data = await response.json();

    console.log('✅ All models responded!\n');
    console.log('=' .repeat(80));

    // Display each model's response
    data.models.forEach((model: any) => {
      console.log(`\n📦 ${model.name.toUpperCase()}`);
      console.log(`Provider: ${model.provider}`);
      console.log(`Response: ${model.content}`);
      console.log(`Tokens: ${model.usage.total_tokens}`);
      console.log(`Duration: ${model.duration_ms}ms`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log('  - Total models queried:', data.models.length);
    console.log('  - Total tokens used:', data.summary.total_tokens);
    console.log('  - Average response time:', Math.round(data.summary.average_duration_ms), 'ms');
    console.log('  - Fastest model:', data.summary.fastest_model);
    console.log('  - Slowest model:', data.summary.slowest_model);
    console.log('\n💰 Total Cost: $0.06 USDC (6 models × $0.01)');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the example
multiModelQuery().catch(console.error);
