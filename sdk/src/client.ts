import axios, { AxiosInstance, AxiosError } from 'axios';
import { PaymentHandler } from './payment';
import { SolanaPaymentHandler, isSolanaNetwork } from './solana-payment';
import { getModel, listModels } from './models';
import type {
  X402Config,
  LLMRequest,
  LLMResponse,
  ModelType,
  ModelInfo,
  PaymentRequirements
} from './types';

export class X402Client {
  private client: AxiosInstance;
  private paymentHandler: PaymentHandler;
  private solanaHandler?: SolanaPaymentHandler;
  private config: X402Config;
  private connectedWallet?: { address: string; wallet: any; network: string };

  constructor(config: X402Config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://jatevo.ai',
      network: config.network || 'base',
      debug: config.debug || false,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Initialize payment handler for EVM/Base
    this.paymentHandler = new PaymentHandler({
      privateKey: config.privateKey,
      network: this.config.network,
      solanaWallet: config.solanaWallet,
      solanaRpcUrl: config.solanaRpcUrl
    });

    // Initialize Solana handler if network is Solana
    if (isSolanaNetwork(this.config.network || '')) {
      this.solanaHandler = new SolanaPaymentHandler({
        network: this.config.network as 'solana' | 'solana-devnet',
        rpcUrl: config.solanaRpcUrl
      });
      // Set wallet if provided
      if (config.solanaWallet) {
        this.solanaHandler.setWallet(config.solanaWallet);
      }
    }

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        if (error.response?.status === 402 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.config.debug) {
            console.log('[X402 SDK] Received 402 Payment Required');
          }

          try {
            // Parse 402 response which may contain multiple payment options
            const paymentResponse = error.response.data;
            
            // Use PaymentHandler to parse and select appropriate requirements
            const paymentRequirements = this.paymentHandler.parsePaymentRequirements(paymentResponse);
            
            if (this.config.debug) {
              console.log(`[X402 SDK] Using ${paymentRequirements.network} network for payment`);
            }

            // For Solana networks, we need to handle payment differently
            if (isSolanaNetwork(paymentRequirements.network)) {
              // Check if we have a connected wallet for Solana
              if (!this.connectedWallet || !this.solanaHandler) {
                throw new Error('Solana wallet not connected. Call connectWallet() first.');
              }

              // Create the actual payment transaction
              const paymentData = await this.solanaHandler.createPayment(
                paymentRequirements.maxAmountRequired,
                paymentRequirements.payTo,
                this.connectedWallet.wallet
              );

              // Create the payment header from the transaction
              const paymentHeader = this.solanaHandler.createPaymentHeader(paymentData, paymentRequirements);
              
              if (this.config.debug) {
                console.log('[X402 SDK] Created Solana payment header with signature:', paymentData.signature);
              }

              originalRequest.headers['X-PAYMENT'] = paymentHeader;
            } else {
              // EVM payment flow
              const paymentHeader = await this.paymentHandler.createPaymentHeader(paymentRequirements);
              
              if (this.config.debug) {
                console.log('[X402 SDK] Created EVM payment header');
              }

              originalRequest.headers['X-PAYMENT'] = paymentHeader;
            }
            
            return this.client(originalRequest);
          } catch (paymentError) {
            if (this.config.debug) {
              console.error('[X402 SDK] Payment failed:', paymentError);
            }
            throw paymentError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Query an LLM model
   */
  async query(model: ModelType, request: LLMRequest): Promise<LLMResponse> {
    const modelInfo = getModel(model);
    
    if (this.config.debug) {
      console.log(`[X402 SDK] Querying ${modelInfo.name} at ${modelInfo.endpoint}`);
    }

    const response = await this.client.post<LLMResponse>(
      modelInfo.endpoint,
      request
    );

    return response.data;
  }

  /**
   * Convenience method for single message queries
   */
  async chat(model: ModelType, message: string, options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    const response = await this.query(model, {
      messages: [{ role: 'user', content: message }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
      stream: false
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * List all available models
   */
  getModels(): ModelInfo[] {
    return listModels();
  }

  /**
   * Get information about a specific model
   */
  getModel(modelId: ModelType): ModelInfo {
    return getModel(modelId);
  }

  /**
   * Get the configured wallet address
   */
  getWalletAddress(): string | undefined {
    if (this.connectedWallet) {
      return this.connectedWallet.address;
    }
    return this.paymentHandler.getWalletAddress();
  }

  /**
   * Check USDC balance (requires separate API implementation)
   */
  async checkBalance(address?: string): Promise<{ balance: string; formatted: string }> {
    const walletAddress = address || this.getWalletAddress();
    if (!walletAddress) {
      throw new Error('No wallet address provided or configured');
    }

    try {
      const response = await this.client.get(`/api/x402/balance/${walletAddress}`);
      return response.data;
    } catch (error) {
      if (this.config.debug) {
        console.error('[X402 SDK] Balance check failed:', error);
      }
      throw error;
    }
  }

  /**
   * Check USDC balance on Solana
   */
  async checkSolanaBalance(address?: string): Promise<number> {
    if (!this.solanaHandler) {
      throw new Error('Solana handler not initialized');
    }

    const walletAddress = address || this.getWalletAddress();
    if (!walletAddress) {
      throw new Error('No wallet address provided or configured');
    }

    return await this.solanaHandler.getUSDCBalance(walletAddress);
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(model: ModelType, estimatedTokens: number = 1000): {
    model: string;
    pricePerRequest: string;
    estimatedCost: string;
  } {
    const modelInfo = getModel(model);
    
    return {
      model: modelInfo.name,
      pricePerRequest: modelInfo.price,
      estimatedCost: modelInfo.price // Fixed price per request
    };
  }

  /**
   * Connect to wallet (browser environment)
   * For Solana: connects to Phantom or Solflare wallets
   * For Base: would connect to MetaMask or other EVM wallets
   */
  async connectWallet(): Promise<{ address: string; network: string }> {
    const network = this.config.network || 'base';
    
    if (isSolanaNetwork(network)) {
      // Initialize Solana handler if not already done
      if (!this.solanaHandler) {
        this.solanaHandler = new SolanaPaymentHandler({
          network: network as 'solana' | 'solana-devnet',
          rpcUrl: this.config.solanaRpcUrl
        });
      }

      // Connect to Solana wallet
      const { wallet, publicKey } = await this.solanaHandler.connectWallet();
      
      // Store the connected wallet for persistence
      this.connectedWallet = {
        address: publicKey,
        wallet: wallet,
        network: network
      };

      // Update payment handler with connected wallet
      this.solanaHandler.setWallet(wallet);
      
      if (this.config.debug) {
        console.log('[X402 SDK] Connected Solana wallet:', publicKey);
      }

      return {
        address: publicKey,
        network: network
      };
    } else {
      // EVM wallet connection would go here (MetaMask, etc.)
      await this.paymentHandler.connectWallet();
      const address = this.getWalletAddress();
      if (!address) {
        throw new Error('Failed to get wallet address after connection');
      }
      
      this.connectedWallet = {
        address: address,
        wallet: null, // EVM wallet object would go here
        network: network
      };

      return {
        address,
        network: network
      };
    }
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.connectedWallet = undefined;
    if (this.solanaHandler) {
      this.solanaHandler.setWallet(null);
    }
  }

  /**
   * Get current network
   */
  getNetwork(): string {
    return this.config.network || 'base';
  }

  /**
   * Check if a network is supported
   */
  supportsNetwork(network: string): boolean {
    return this.paymentHandler.supportsNetwork(network);
  }

  /**
   * Switch to a different network
   */
  switchNetwork(network: 'base' | 'base-testnet' | 'solana' | 'solana-devnet'): void {
    this.config.network = network;
    
    // Clear connected wallet on network switch
    this.disconnectWallet();
    
    // Recreate payment handler with new network
    this.paymentHandler = new PaymentHandler({
      privateKey: this.config.privateKey,
      network: network,
      solanaWallet: this.config.solanaWallet,
      solanaRpcUrl: this.config.solanaRpcUrl
    });

    // Create Solana handler if switching to Solana
    if (isSolanaNetwork(network)) {
      this.solanaHandler = new SolanaPaymentHandler({
        network: network as 'solana' | 'solana-devnet',
        rpcUrl: this.config.solanaRpcUrl
      });
    } else {
      this.solanaHandler = undefined;
    }
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return !!this.connectedWallet;
  }

  /**
   * Get connected wallet info
   */
  getConnectedWallet(): { address: string; network: string } | null {
    if (!this.connectedWallet) {
      return null;
    }
    return {
      address: this.connectedWallet.address,
      network: this.connectedWallet.network
    };
  }
}