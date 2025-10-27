import 'dotenv/config';

/**
 * Conversation with Context Example
 * 
 * This example demonstrates how to maintain context across multiple
 * exchanges in a conversation.
 */

async function conversationWithContext() {
  const { x402Fetch } = await import('x402-fetch');
  
  const fetch = x402Fetch({
    privateKey: process.env.PRIVATE_KEY!,
    network: 'base'
  });

  // Maintain conversation history
  const conversation = [
    { role: 'system', content: 'You are a helpful coding assistant specializing in TypeScript.' },
    { role: 'user', content: 'What is a Promise in TypeScript?' }
  ];

  console.log('🚀 Starting multi-turn conversation with GLM 4.5...\n');
  console.log('=' .repeat(80));

  try {
    // First exchange
    console.log('\n👤 User:', conversation[1].content);
    
    let response = await fetch('https://jatevo.ai/api/x402/llm/glm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversation,
        temperature: 0.7,
        max_tokens: 300
      })
    });

    let data = await response.json();
    const firstResponse = data.choices[0].message.content;
    conversation.push({ role: 'assistant', content: firstResponse });
    
    console.log('\n🤖 Assistant:', firstResponse);
    console.log('\n💰 Cost: $0.01 USDC');

    // Second exchange (with context)
    const followUp = 'Can you show me a simple example?';
    conversation.push({ role: 'user', content: followUp });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n👤 User:', followUp);
    
    response = await fetch('https://jatevo.ai/api/x402/llm/glm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversation,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    data = await response.json();
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
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the example
conversationWithContext().catch(console.error);
