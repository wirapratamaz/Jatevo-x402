#!/usr/bin/env node

/**
 * Basic example for calling Jatevo LLM API from terminal/VSCode
 * 
 * Usage:
 *   1. Set your private key: export PRIVATE_KEY="0x..."
 *   2. Run: node basic.js
 */

const { withPaymentInterceptor } = require('jatevo-x402-sdk');
const axios = require('axios');

// Check for private key
if (!process.env.PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable not set');
  console.error('Set it with: export PRIVATE_KEY="0x..."');
  process.exit(1);
}

async function main() {
  // Create client with payment handler
  const client = withPaymentInterceptor(
    axios.create(),
    process.env.PRIVATE_KEY
  );

  try {
    console.log('🚀 Calling Qwen model...\n');

    // Make API request
    const response = await client.post('https://api.jatevo.ai/chat/completions/qwen', {
      messages: [
        {
          role: 'user',
          content: 'Write a haiku about programming'
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    // Display response
    console.log('📝 Response:');
    console.log(response.data.choices[0].message.content);
    console.log('\n✅ Success! Cost: $0.01 USDC');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 402) {
      console.error('\n💡 Tip: Check your USDC balance on Base or Solana');
    }
  }
}

// Run the example
main();