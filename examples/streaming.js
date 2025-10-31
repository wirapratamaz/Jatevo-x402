#!/usr/bin/env node

/**
 * Streaming example for Jatevo LLM API
 * 
 * Shows how to receive responses as they're generated
 * 
 * Usage:
 *   1. Set your private key: export PRIVATE_KEY="0x..."
 *   2. Run: node streaming.js
 */

const { withPaymentInterceptor } = require('jatevo-x402-sdk');
const axios = require('axios');

if (!process.env.PRIVATE_KEY) {
  console.error('Error: PRIVATE_KEY environment variable not set');
  process.exit(1);
}

async function streamChat() {
  const client = withPaymentInterceptor(
    axios.create(),
    process.env.PRIVATE_KEY
  );

  try {
    console.log('🚀 Starting streaming response...\n');

    const response = await client.post(
      'https://api.jatevo.ai/chat/completions/kimi',
      {
        messages: [
          {
            role: 'user',
            content: 'Tell me a short story about a robot learning to code'
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        stream: true
      },
      {
        responseType: 'stream'
      }
    );

    // Handle streaming data
    response.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n\n✅ Stream complete!');
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              process.stdout.write(content);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('\n\n✨ Done! Cost: $0.01 USDC');
    });

    response.data.on('error', error => {
      console.error('\n❌ Stream error:', error.message);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

streamChat();