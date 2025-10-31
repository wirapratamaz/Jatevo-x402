/**
 * Solana payment handler for x402 protocol
 * Handles USDC transfers on Solana blockchain
 */

// Helper function to check if network is Solana
export function isSolanaNetwork(network: string): boolean {
  return network === 'solana' || network === 'solana-devnet';
}

import { 
  Connection, 
  PublicKey, 
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  Keypair,
  SendTransactionError
} from '@solana/web3.js';

import { 
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

import type { SolanaPaymentData, PaymentRequirements } from './types';

// Solana configuration
const SOLANA_CONFIG = {
  mainnet: {
    network: 'solana' as const,
    usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  },
  devnet: {
    network: 'solana-devnet' as const,
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC-Dev on devnet
    rpcUrl: 'https://api.devnet.solana.com'
  }
};

export class SolanaPaymentHandler {
  private connection: Connection;
  private network: 'solana' | 'solana-devnet';
  private usdcMint: PublicKey;
  private wallet: any; // Will be Phantom/Solflare provider or Keypair for Node.js
  
  constructor(config?: { network?: 'solana' | 'solana-devnet'; rpcUrl?: string }) {
    this.network = config?.network || 'solana';
    const configData = this.network === 'solana' ? SOLANA_CONFIG.mainnet : SOLANA_CONFIG.devnet;
    this.connection = new Connection(config?.rpcUrl || configData.rpcUrl, 'confirmed');
    this.usdcMint = new PublicKey(configData.usdcMint);
  }

  /**
   * Set the wallet provider (Phantom, Solflare, or Keypair)
   */
  setWallet(wallet: any) {
    this.wallet = wallet;
  }

  /**
   * Connect to a browser wallet (Phantom or Solflare)
   */
  async connectWallet(): Promise<{ wallet: any; publicKey: string }> {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
      const window = (globalThis as any).window;
      
      // Try Phantom first
      if (window.phantom?.solana?.isPhantom) {
        try {
          const response = await window.phantom.solana.connect();
          this.wallet = window.phantom.solana;
          return { 
            wallet: this.wallet, 
            publicKey: response.publicKey.toString() 
          };
        } catch (err) {
          console.error('Phantom connection failed:', err);
        }
      }
      
      // Try Solflare
      if (window.solflare?.isSolflare) {
        try {
          await window.solflare.connect();
          this.wallet = window.solflare;
          return { 
            wallet: this.wallet, 
            publicKey: window.solflare.publicKey.toString() 
          };
        } catch (err) {
          console.error('Solflare connection failed:', err);
        }
      }
      
      throw new Error('No Solana wallet found. Please install Phantom or Solflare.');
    }
    
    throw new Error('Wallet connection is only available in browser environment');
  }

  /**
   * Get USDC balance for a wallet address
   */
  async getUSDCBalance(walletAddress: string): Promise<number> {
    try {
      const walletPubkey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        this.usdcMint,
        walletPubkey
      );
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.uiAmountString || '0');
    } catch (error: any) {
      if (error.message?.includes('could not find account')) {
        return 0;
      }
      throw error;
    }
  }

  /**
   * Create and sign a Solana USDC payment transaction
   */
  async createPayment(
    amount: string,
    receiverAddress: string,
    wallet?: any
  ): Promise<SolanaPaymentData> {
    if (!wallet && !this.wallet) {
      throw new Error('Wallet is required for Solana payments');
    }
    
    const activeWallet = wallet || this.wallet;
    const senderPublicKey = activeWallet.publicKey || 
      (activeWallet instanceof Keypair ? activeWallet.publicKey : new PublicKey(activeWallet));
    
    const amountMicroUsdc = parseInt(amount);
    const receiverPubkey = new PublicKey(receiverAddress);
    
    // Get or create token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      senderPublicKey
    );
    
    const receiverTokenAccount = await getAssociatedTokenAddress(
      this.usdcMint,
      receiverPubkey
    );
    
    // Check sender balance
    try {
      const senderAccount = await getAccount(this.connection, senderTokenAccount);
      const balance = Number(senderAccount.amount);
      
      if (balance < amountMicroUsdc) {
        throw new Error(`Insufficient USDC balance. Have: ${balance / 1_000_000} USDC, Need: ${amountMicroUsdc / 1_000_000} USDC`);
      }
    } catch (error: any) {
      if (error instanceof TokenAccountNotFoundError) {
        throw new Error('No USDC token account found. Please ensure you have USDC in your wallet.');
      }
      throw error;
    }
    
    // Create transaction
    const transaction = new Transaction();
    
    // Check if receiver token account exists, create if not
    try {
      await getAccount(this.connection, receiverTokenAccount);
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        // Add instruction to create receiver's token account
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          senderPublicKey,
          receiverTokenAccount,
          receiverPubkey,
          this.usdcMint
        );
        transaction.add(createATAInstruction);
      }
    }
    
    // Add transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      receiverTokenAccount,
      senderPublicKey,
      amountMicroUsdc
    );
    
    transaction.add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;
    
    // Sign and send transaction
    let signature: string;
    
    if (typeof activeWallet.signAndSendTransaction === 'function') {
      // Browser wallet (Phantom/Solflare)
      const signedTx = await activeWallet.signAndSendTransaction(transaction);
      signature = signedTx.signature || signedTx;
      
      // Wait for confirmation
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
    } else if (activeWallet instanceof Keypair) {
      // Node.js with Keypair
      signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [activeWallet],
        { commitment: 'confirmed' }
      );
    } else {
      throw new Error('Unsupported wallet type');
    }
    
    // Return payment data
    return {
      network: this.network,
      signature,
      from: senderPublicKey.toString(),
      to: receiverAddress,
      amount,
      timestamp: Date.now(),
      confirmed: true
    };
  }

  /**
   * Verify a payment transaction on-chain
   */
  async verifyPayment(signature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      return tx !== null && tx.meta?.err === null;
    } catch (error) {
      console.error('Error verifying Solana payment:', error);
      return false;
    }
  }

  /**
   * Create payment header for Solana (base64 encoded)
   * This is called after a payment is made to create the header for backend verification
   */
  createPaymentHeader(paymentData: SolanaPaymentData, requirements?: PaymentRequirements): string {
    // Create the payment header object with signature and details
    const header = {
      network: paymentData.network,
      signature: paymentData.signature,
      from: paymentData.from,
      to: paymentData.to,
      amount: paymentData.amount || paymentData.value,
      timestamp: paymentData.timestamp || Date.now()
    };
    
    return Buffer.from(JSON.stringify(header)).toString('base64');
  }

  /**
   * Parse payment requirements for Solana
   */
  static parsePaymentRequirements(requirements: PaymentRequirements): {
    receiverAddress: string;
    amount: string;
    network: 'solana' | 'solana-devnet';
  } {
    if (requirements.network !== 'solana' && requirements.network !== 'solana-devnet') {
      throw new Error('Invalid network for Solana payment handler');
    }
    
    return {
      receiverAddress: requirements.payTo,
      amount: requirements.maxAmountRequired,
      network: requirements.network
    };
  }
}