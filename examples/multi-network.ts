/**
 * Multi-Network Example
 * 
 * This example demonstrates dynamic network selection based on
 * user preference or payment requirements.
 */

import { X402Client } from 'jatevo-x402-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { Keypair } from '@solana/web3.js';
import * as readline from 'readline';

// Helper to get user input
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('=== JATEVO x402 Multi-Network Example ===\n');
  
  // Initialize client without network preference
  const client = new X402Client({
    baseUrl: 'https://jatevo.ai',
    debug: true
  });

  // Ask user for network preference
  const networkChoice = await prompt('Select network (1=Base, 2=Solana): ');
  
  if (networkChoice === '1') {
    // Configure for Base network
    console.log('\nConfiguring for Base network...');
    
    const privateKey = await prompt('Enter your Base private key (0x...): ');
    
    client.switchNetwork('base');
    // In a real app, you'd use the private key to configure the client
    // For now, we'll use the viem account
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('Using Base wallet:', account.address);
    
  } else if (networkChoice === '2') {
    // Configure for Solana network
    console.log('\nConfiguring for Solana network...');
    
    const walletChoice = await prompt('Use (1) Browser wallet or (2) Keypair file?: ');
    
    if (walletChoice === '1') {
      // Browser wallet (Phantom/Solflare)
      console.log('Connecting to browser wallet...');
      client.switchNetwork('solana');
      
      try {
        const { address } = await client.connectWallet();
        console.log('Connected to Solana wallet:', address);
      } catch (error) {
        console.error('Failed to connect wallet. Make sure Phantom is installed.');
        process.exit(1);
      }
      
    } else {
      // Keypair file
      const keypairPath = await prompt('Enter keypair file path (default: ./solana-keypair.json): ') || './solana-keypair.json';
      
      try {
        const fs = require('fs');
        const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
        
        client.switchNetwork('solana');
        console.log('Using Solana wallet:', keypair.publicKey.toBase58());
        
      } catch (error) {
        console.error('Failed to load keypair:', error);
        process.exit(1);
      }
    }
  }

  // Now make API requests
  console.log('\n--- Making API Request ---');
  
  const model = await prompt('Select model (qwen/glm/kimi/deepseek-v3.1): ') || 'qwen';
  const question = await prompt('Enter your question: ') || 'What is artificial intelligence?';
  
  try {
    console.log(`\nQuerying ${model} on ${client.getNetwork()} network...`);
    
    const response = await client.chat(model as any, question, {
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log('\n--- Response ---');
    console.log(response);
    
    // Check final state
    const network = client.getNetwork();
    const address = client.getWalletAddress();
    
    console.log('\n--- Transaction Summary ---');
    console.log('Network used:', network);
    console.log('Wallet address:', address);
    console.log('Model:', model);
    console.log('Cost: 0.01 USDC');
    
  } catch (error: any) {
    if (error.response?.status === 402) {
      console.log('\n--- Payment Required ---');
      const paymentOptions = error.response.data.paymentOptions;
      console.log('Available networks:', paymentOptions);
      
      // Show payment details for each network
      const details = error.response.data.paymentDetails;
      for (const [network, info] of Object.entries(details)) {
        console.log(`\n${network.toUpperCase()}:`);
        console.log('  Address:', (info as any).address);
        console.log('  Amount:', (info as any).amount, 'USDC (smallest unit)');
        console.log('  Token:', (info as any).token);
      }
      
      console.log('\nPlease configure your wallet and try again.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the example
main().catch(console.error);