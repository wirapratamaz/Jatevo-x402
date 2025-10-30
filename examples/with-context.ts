import 'dotenv/config';
import { withPaymentInterceptor } from 'x402-axios';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

/**
 * Conversation with Context Example
 * 
 * This example demonstrates how to maintain context across multiple
 * exchanges in a conversation.
 */

async function conversationWithContext() {
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

  // Maintain conversation history
  const conversation = [
    { role: 'system', content: 'You are a helpful coding assistant specializing in TypeScript.' },
    { role: 'user', content: 'What is a Promise in TypeScript?' }
  ];

  console.log('🚀 Starting multi-turn conversation with GLM 4.5...\n');
  console.log('='.repeat(80));

  try {
    // First exchange
    console.log('\n👤 User:', conversation[1].content);
    
    let response = await client.post('/api/x402/llm/glm', {
      messages: conversation,
      temperature: 0.7,
      max_tokens: 300,
      stream: false
    });

    let data = response.data;
    const firstResponse = data.choices[0].message.content;
    conversation.push({ role: 'assistant', content: firstResponse });
    
    console.log('\n🤖 Assistant:', firstResponse);
    console.log('\n💰 Cost: $0.01 USDC');

    // Second exchange (with context)
    const followUp = 'Can you show me a simple example?';
    conversation.push({ role: 'user', content: followUp });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n👤 User:', followUp);
    
    response = await client.post('/api/x402/llm/glm', {
      messages: conversation,
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    });

    data = response.data;
    const secondResponse = data.choices[0].message.content;
    
    console.log('\n🤖 Assistant:', secondResponse);
    console.log('\n💰 Cost: $0.01 USDC');

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Conversation Summary:');
    console.log('  - Total exchanges: 2');
    console.log('  - Messages in context:', conversation.length);
    console.log('  - Total cost: $0.02 USDC');
    console.log('\n✓ Context maintained across both requests!');

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Run the example
conversationWithContext().catch(console.error);
