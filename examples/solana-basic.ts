/**
 * Basic Solana Network Example
 * 
 * This example shows how to use the JATEVO x402 API with Solana network
 * for server-side applications using a Keypair.
 */

import { X402Client } from 'jatevo-x402-sdk';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

async function main() {
  // Load Solana keypair from file or generate one
  let keypair: Keypair;
  
  try {
    // Try to load existing keypair
    const secretKey = JSON.parse(fs.readFileSync('./solana-keypair.json', 'utf-8'));
    keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch {
    // Generate new keypair if none exists
    keypair = Keypair.generate();
    fs.writeFileSync('./solana-keypair.json', JSON.stringify(Array.from(keypair.secretKey)));
    console.log('Generated new Solana keypair. Address:', keypair.publicKey.toBase58());
    console.log('Please fund this wallet with SOL and USDC on Solana mainnet to continue.');
    process.exit(0);
  }

  console.log('Using Solana wallet:', keypair.publicKey.toBase58());

  // Initialize the client for Solana network
  const client = new X402Client({
    baseUrl: 'https://jatevo.ai',
    network: 'solana',
    solanaWallet: keypair,
    solanaRpcUrl: 'https://api.mainnet-beta.solana.com',
    debug: true
  });

  try {
    // Check USDC balance first
    const balance = await client.checkSolanaBalance();
    console.log(`USDC Balance: ${balance / 1_000_000} USDC`);

    if (balance < 10_000) {
      console.log('Insufficient USDC balance. Need at least 0.01 USDC to make a request.');
      process.exit(1);
    }

    // Example 1: Simple chat with Qwen model
    console.log('\n--- Example 1: Simple Chat ---');
    const response1 = await client.chat('qwen', 'What is the capital of France?');
    console.log('Qwen:', response1);

    // Example 2: Chat with DeepSeek V3.1
    console.log('\n--- Example 2: DeepSeek V3.1 ---');
    const response2 = await client.query('deepseek-v3.1', {
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: 'Write a simple hello world function in Rust' }
      ],
      temperature: 0.5,
      max_tokens: 500
    });
    console.log('DeepSeek:', response2.choices[0].message.content);

    // Example 3: Complex conversation with Kimi K2
    console.log('\n--- Example 3: Multi-turn Conversation ---');
    const response3 = await client.query('kimi', {
      messages: [
        { role: 'user', content: 'I want to learn about blockchain technology' },
        { role: 'assistant', content: 'I can help you learn about blockchain! What aspect interests you most?' },
        { role: 'user', content: 'How does consensus work in proof of stake?' }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    console.log('Kimi:', response3.choices[0].message.content);

    // Show final balance
    const finalBalance = await client.checkSolanaBalance();
    console.log(`\nFinal USDC Balance: ${finalBalance / 1_000_000} USDC`);
    console.log(`Total spent: ${(balance - finalBalance) / 1_000_000} USDC`);

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Run the example
main().catch(console.error);