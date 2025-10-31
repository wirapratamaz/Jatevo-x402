import { privateKeyToAccount } from 'viem/accounts';
import { encodePacked, keccak256, toHex } from 'viem';
import { randomBytes } from 'crypto';
import type { PaymentRequirements, PaymentData, EVMPaymentData, SolanaPaymentData } from './types';
import { SolanaPaymentHandler, isSolanaNetwork } from './solana-payment';

/**
 * Unified Payment Handler that supports both EVM (Base) and Solana networks
 */
export class PaymentHandler {
  private evmAccount: any;
  private solanaHandler: SolanaPaymentHandler | null = null;
  private network: string;

  constructor(config?: {
    privateKey?: string;
    network?: string;
    solanaWallet?: any;
    solanaRpcUrl?: string;
  }) {
    // Set network (default to 'base')
    this.network = config?.network || 'base';

    // Initialize EVM account if private key provided and network is EVM
    if (config?.privateKey && !isSolanaNetwork(this.network)) {
      this.evmAccount = privateKeyToAccount(config.privateKey as `0x${string}`);
    }

    // Initialize Solana handler if network is Solana
    if (isSolanaNetwork(this.network)) {
      this.solanaHandler = new SolanaPaymentHandler({
        rpcUrl: config?.solanaRpcUrl,
        network: this.network as 'solana' | 'solana-devnet'
      });
    }
  }

  /**
   * Create payment header based on network type
   */
  async createPaymentHeader(requirements: PaymentRequirements): Promise<string> {
    // Check if requirements specify a network
    const reqNetwork = requirements.network || this.network;
    
    if (isSolanaNetwork(reqNetwork)) {
      return this.createSolanaPaymentHeader(requirements);
    } else {
      return this.createEVMPaymentHeader(requirements);
    }
  }

  /**
   * Create EVM (Base) payment header
   */
  private async createEVMPaymentHeader(requirements: PaymentRequirements): Promise<string> {
    if (!this.evmAccount) {
      throw new Error('No private key configured for EVM payments. Cannot create payment.');
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const nonce = requirements.nonce || this.generateNonce();
    
    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: this.getChainId(),
      verifyingContract: requirements.asset as `0x${string}`
    };

    const types = {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' }
      ]
    };

    const payTo = requirements.from || '0xB389c8b863193B2A1e48deFD007413702196723B';
    const message = {
      from: this.evmAccount.address,
      to: payTo as `0x${string}`,
      value: BigInt(requirements.maxAmountRequired),
      validAfter: 0n,
      validBefore: BigInt(deadline),
      nonce: nonce as `0x${string}`
    };

    const signature = await this.evmAccount.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message
    });

    const { v, r, s } = this.parseEVMSignature(signature);

    const paymentData: EVMPaymentData = {
      from: this.evmAccount.address,
      to: message.to,
      value: requirements.maxAmountRequired,
      nonce: nonce,
      deadline,
      signature: { v, r, s }
    };

    return Buffer.from(JSON.stringify(paymentData)).toString('base64');
  }

  /**
   * Create Solana payment header
   */
  private async createSolanaPaymentHeader(requirements: PaymentRequirements): Promise<string> {
    if (!this.solanaHandler) {
      throw new Error('Solana handler not initialized. Cannot create Solana payment.');
    }

    // For Solana, we need to handle the payment creation differently
    // This is a simplified version - in production, you'd need actual wallet integration
    const paymentData: SolanaPaymentData = {
      from: '', // Will be filled by wallet
      to: requirements.payTo || '', // Receiver address from requirements
      amount: requirements.maxAmountRequired,
      value: requirements.maxAmountRequired, // Legacy compatibility
      signature: '', // Will be filled after transaction
      network: this.network as 'solana' | 'solana-devnet'
    };

    // In a browser environment with wallet, this would create the actual payment
    // For now, return a placeholder that the client will need to complete
    return this.solanaHandler.createPaymentHeader(paymentData, requirements);
  }

  /**
   * Get chain ID based on network
   */
  private getChainId(): number {
    switch (this.network) {
      case 'base':
        return 8453; // Base mainnet
      case 'base-testnet':
      case 'base-sepolia':
        return 84532; // Base Sepolia
      default:
        return 8453;
    }
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    const bytes = randomBytes(32);
    return toHex(bytes);
  }

  /**
   * Parse EVM signature
   */
  private parseEVMSignature(signature: string): { v: number; r: string; s: string } {
    const sig = signature.slice(2);
    const r = `0x${sig.slice(0, 64)}`;
    const s = `0x${sig.slice(64, 128)}`;
    const v = parseInt(sig.slice(128, 130), 16);
    
    return { v, r, s };
  }

  /**
   * Get wallet address based on network
   */
  getWalletAddress(): string | undefined {
    if (isSolanaNetwork(this.network)) {
      // For Solana, return connected wallet address
      // This would be implemented with actual wallet connection
      return undefined; // Placeholder
    }
    return this.evmAccount?.address;
  }

  /**
   * Check if payment handler supports a network
   */
  supportsNetwork(network: string): boolean {
    return ['base', 'base-testnet', 'base-sepolia', 'solana', 'solana-devnet'].includes(network);
  }

  /**
   * Parse payment requirements from 402 response
   * Automatically detects and returns the appropriate requirements
   */
  parsePaymentRequirements(response: any): PaymentRequirements {
    const accepts = response.accepts || [];
    
    // Find requirements for current network
    let requirements = accepts.find((req: any) => req.network === this.network);
    
    // Fallback to any available requirements
    if (!requirements && accepts.length > 0) {
      requirements = accepts[0];
      console.warn(`No requirements found for network ${this.network}, using ${requirements.network}`);
    }
    
    if (!requirements) {
      throw new Error('No payment requirements found in 402 response');
    }
    
    return requirements;
  }

  /**
   * Connect to wallet (browser environment)
   */
  async connectWallet(): Promise<void> {
    if (isSolanaNetwork(this.network) && this.solanaHandler) {
      await this.solanaHandler.connectWallet();
    }
    // EVM wallets would be handled differently (MetaMask, etc.)
  }
}

// Export convenience function for backward compatibility
export function createPaymentHandler(privateKeyOrConfig?: string | any) {
  if (typeof privateKeyOrConfig === 'string') {
    // Backward compatibility: treat string as private key
    return new PaymentHandler({ privateKey: privateKeyOrConfig });
  }
  return new PaymentHandler(privateKeyOrConfig);
}