import { useAccount } from 'wagmi';
import { getDivviReferralTag, trackDivviTransaction } from '@/lib/divvi';

/**
 * Hook for integrating Divvi referral tracking into TheOnePercent transactions
 * Based on ads-Bazaar pattern but tailored for gaming platform
 */
export function useDivviIntegration() {
  const { address, isConnected } = useAccount();

  /**
   * Generate a Divvi referral tag for the current user
   * @returns Hex referral tag string
   */
  const generateDivviReferralTag = (): string => {
    if (!address || !isConnected) {
      console.warn('⚠️ Cannot generate Divvi referral tag: No wallet connected');
      return '0x';
    }

    console.log('🎮 Generating Divvi referral tag for TheOnePercent user:', address);
    return getDivviReferralTag(address);
  };

  /**
   * Generate Divvi tag with additional context for gaming platform
   * @returns Hex referral tag string
   */
  const generateDivviTag = (): string => {
    if (!address || !isConnected) {
      console.warn('⚠️ Cannot generate Divvi tag: No wallet connected');
      return '0x';
    }

    const tag = getDivviReferralTag(address);
    console.log('🎯 Generated Divvi tag for gaming operation:', {
      user: address,
      tag,
      platform: 'TheOnePercent'
    });

    return tag;
  };

  /**
   * Track a completed transaction with Divvi
   * @param txHash - Transaction hash
   * @param chainId - Chain ID (defaults to Celo mainnet)
   */
  const trackTransaction = async (txHash: string, chainId: number = 42220): Promise<void> => {
    if (!txHash) {
      console.warn('⚠️ Cannot track transaction: No transaction hash provided');
      return;
    }

    console.log('🔗 Tracking TheOnePercent transaction with Divvi:', {
      txHash,
      chainId,
      user: address,
      platform: 'TheOnePercent Gaming'
    });

    await trackDivviTransaction(txHash, chainId);
  };

  return {
    generateDivviReferralTag,
    generateDivviTag,
    trackTransaction,
    isConnected,
    userAddress: address
  };
}