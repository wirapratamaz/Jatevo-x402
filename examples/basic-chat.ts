import 'dotenv/config';

/**
 * Basic Chat Example
 * 
 * This example demonstrates how to make a simple chat completion request
 * to the JATEVO x402 AI Inference API using the Qwen model.
 */

async function basicChat() {
  const { x402Fetch } = await import('x402-fetch');
  
  // Configure x402-enabled fetch with your private key
  const fetch = x402Fetch({
    privateKey: process.env.PRIVATE_KEY!,
    network: 'base'
  });

  console.log('🚀 Sending chat request to Qwen 3 Coder 480B...\n');

  try {
    const response = await fetch('https://jatevo.ai/api/x402/llm/qwen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { 
            role: 'user', 
            content: 'Explain quantum computing in simple terms, under 100 words' 
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();

    console.log('✅ Response received!\n');
    console.log('Model:', data.model);
    console.log('Response:', data.choices[0].message.content);
    console.log('\n📊 Usage:');
    console.log('  - Prompt tokens:', data.usage.prompt_tokens);
    console.log('  - Completion tokens:', data.usage.completion_tokens);
    console.log('  - Total tokens:', data.usage.total_tokens);
    console.log('\n💰 Cost: $0.01 USDC');
    
    // Payment confirmation is in the response headers
    console.log('\n✓ Payment verified via x402');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the example
basicChat().catch(console.error);
