import 'dotenv/config';

/**
 * Model Comparison Example
 * 
 * This example demonstrates how to compare responses from different models
 * for the same prompt by querying them individually.
 */

async function compareModels() {
  const { x402Fetch } = await import('x402-fetch');
  
  const fetch = x402Fetch({
    privateKey: process.env.PRIVATE_KEY!,
    network: 'base'
  });

  const prompt = 'Write a haiku about artificial intelligence';

  // Models to compare
  const models = [
    { name: 'Qwen 3 Coder 480B', endpoint: 'qwen', id: 'qwen-3-coder-480b' },
    { name: 'DeepSeek R1', endpoint: 'deepseek-r1-0528', id: 'deepseek-r1' },
    { name: 'Kimi K2', endpoint: 'kimi', id: 'kimi-k2-instruct' }
  ];

  console.log('🚀 Comparing 3 models for the same prompt...');
  console.log('Prompt:', prompt, '\n');
  console.log('=' .repeat(80));

  const results = [];

  for (const model of models) {
    console.log(`\n📦 Querying ${model.name}...`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(
        `https://jatevo.ai/api/x402/llm/${model.endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 100
          })
        }
      );

      const data = await response.json();
      const duration = Date.now() - startTime;

      results.push({
        name: model.name,
        content: data.choices[0].message.content,
        tokens: data.usage.total_tokens,
        duration
      });

      console.log('✓ Response received in', duration, 'ms');

    } catch (error: any) {
      console.error(`✗ Error with ${model.name}:`, error.message);
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
