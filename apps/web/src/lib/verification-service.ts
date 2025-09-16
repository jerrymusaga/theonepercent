import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { celoAlfajores, celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// CoinToss contract ABI (add the relevant functions)
const COINTOSS_ABI = [
  {
    "inputs": [
      {"internalType": "bytes", "name": "proofPayload", "type": "bytes"},
      {"internalType": "bytes", "name": "userContextData", "type": "bytes"}
    ],
    "name": "verifySelfProof",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "creator", "type": "address"}],
    "name": "isCreatorVerified",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "creator", "type": "address"}],
    "name": "getVerificationInfo",
    "outputs": [
      {"internalType": "bool", "name": "isVerified", "type": "bool"},
      {"internalType": "uint256", "name": "bonusPools", "type": "uint256"},
      {"internalType": "uint256", "name": "verificationTimestamp", "type": "uint256"},
      {"internalType": "string", "name": "status", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract addresses
const COINTOSS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_COINTOSS_CONTRACT_ADDRESS as `0x${string}`;
const CHAIN = process.env.NODE_ENV === "production" ? celo : celoAlfajores;

// Create clients
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http()
});

// For contract writes, you'll need a backend wallet
// In production, this should be a dedicated service wallet
let walletClient: any = null;

if (process.env.BACKEND_PRIVATE_KEY) {
  const account = privateKeyToAccount(process.env.BACKEND_PRIVATE_KEY as `0x${string}`);
  walletClient = createWalletClient({
    account,
    chain: CHAIN,
    transport: http()
  });
}

export class VerificationService {
  /**
   * Submit verification to the CoinToss contract
   */
  static async submitVerificationToContract(
    userAddress: string,
    proofPayload: any,
    userContextData: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!walletClient) {
        throw new Error("Backend wallet not configured");
      }

      if (!COINTOSS_CONTRACT_ADDRESS) {
        throw new Error("CoinToss contract address not configured");
      }

      // Encode the proof payload and user context data
      const encodedProofPayload = `0x${Buffer.from(JSON.stringify(proofPayload)).toString('hex')}`;
      const encodedUserContextData = `0x${Buffer.from(userContextData, 'utf8').toString('hex')}`;

      // Submit verification to contract
      const hash = await walletClient.writeContract({
        address: COINTOSS_CONTRACT_ADDRESS,
        abi: COINTOSS_ABI,
        functionName: 'verifySelfProof',
        args: [encodedProofPayload, encodedUserContextData]
      });

      return {
        success: true,
        txHash: hash
      };

    } catch (error: any) {
      console.error("Contract verification failed:", error);
      return {
        success: false,
        error: error.message || "Failed to submit verification to contract"
      };
    }
  }

  /**
   * Check if a user is verified on-chain
   */
  static async isUserVerified(userAddress: string): Promise<boolean> {
    try {
      if (!COINTOSS_CONTRACT_ADDRESS) {
        return false;
      }

      const result = await publicClient.readContract({
        address: COINTOSS_CONTRACT_ADDRESS,
        abi: COINTOSS_ABI,
        functionName: 'isCreatorVerified',
        args: [userAddress as `0x${string}`]
      });

      return result as boolean;

    } catch (error) {
      console.error("Failed to check verification status:", error);
      return false;
    }
  }

  /**
   * Get detailed verification information for a user
   */
  static async getVerificationInfo(userAddress: string): Promise<{
    isVerified: boolean;
    bonusPools: number;
    verificationTimestamp: number;
    status: string;
  } | null> {
    try {
      if (!COINTOSS_CONTRACT_ADDRESS) {
        return null;
      }

      const result = await publicClient.readContract({
        address: COINTOSS_CONTRACT_ADDRESS,
        abi: COINTOSS_ABI,
        functionName: 'getVerificationInfo',
        args: [userAddress as `0x${string}`]
      });

      const [isVerified, bonusPools, verificationTimestamp, status] = result as [boolean, bigint, bigint, string];

      return {
        isVerified,
        bonusPools: Number(bonusPools),
        verificationTimestamp: Number(verificationTimestamp),
        status
      };

    } catch (error) {
      console.error("Failed to get verification info:", error);
      return null;
    }
  }

  /**
   * Store nullifier to prevent replay attacks
   * In production, this should store to a database
   */
  static async storeNullifier(nullifier: string, userAddress: string): Promise<boolean> {
    try {
      // TODO: Implement database storage
      // For now, we'll use a simple in-memory store (NOT for production)

      console.log(`Storing nullifier ${nullifier} for user ${userAddress}`);
      return true;

    } catch (error) {
      console.error("Failed to store nullifier:", error);
      return false;
    }
  }

  /**
   * Check if nullifier has been used before
   */
  static async isNullifierUsed(nullifier: string): Promise<boolean> {
    try {
      // TODO: Implement database check
      // For now, return false (NOT for production)

      return false;

    } catch (error) {
      console.error("Failed to check nullifier:", error);
      return false;
    }
  }
}

export default VerificationService;