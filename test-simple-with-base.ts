import 'dotenv/config';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createPaymentHeader } from 'x402/client';

async function testSimpleWithBase() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // Create proper wallet client
  const walletClient = createWalletClient({
    account,
    transport: http(),
    chain: baseSepolia,
  });

  // Custom axios client with manual x402 handling
  const client = axios.create({ baseURL: 'https://jatevo.ai' });

  try {
    // First request - will get 402 with Solana requirements
    console.log('🚀 Making initial request to Qwen Coder...');
    const response = await client.post('/api/x402/llm/qwen', {
      messages: [
        { role: 'user', content: 'Explain quantum computing in simple terms' }
      ],
      temperature: 0.7,
      max_tokens: 64000,
      stream: false
    });

    console.log(response.data.choices[0].message.content);

  } catch (error: any) {
    if (error.response?.status === 402) {
      console.log('💳 Received 402 Payment Required');
      const { x402Version, accepts } = error.response.data;

      console.log('📋 Original payment requirements:', accepts);

      // Manually create payment requirements with Base network
      const basePaymentRequirements = {
        ...accepts[0], // Copy all original properties
        network: 'base' // Force Base network
      };

      console.log('✅ Modified payment requirements for Base network:', basePaymentRequirements);

      try {
        // Create payment header with Base network
        const paymentHeader = await createPaymentHeader(
          walletClient, // Use proper wallet client
          x402Version,
          basePaymentRequirements
        );

        console.log('🔐 Payment header created successfully');

        // Retry request with payment header
        console.log('🔄 Retrying request with payment header...');
        const retryResponse = await client.post('/api/x402/llm/qwen', {
          messages: [
            { role: 'user', content: 'Explain quantum computing in simple terms' }
          ],
          temperature: 0.7,
          max_tokens: 64000,
          stream: false
        }, {
          headers: {
            'X-PAYMENT': paymentHeader,
            'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE'
          }
        });

        console.log('✅ Success! Response received:');
        console.log(retryResponse.data.choices[0].message.content);

      } catch (paymentError: any) {
        console.error('❌ Payment creation failed:', paymentError.message);
        console.error('Details:', paymentError.response?.data || paymentError);
      }
    } else {
      console.error('❌ Request failed:', error.message);
      console.error('Details:', error.response?.data || error);
    }
  }
}

// Run the test
testSimpleWithBase().catch(console.error);