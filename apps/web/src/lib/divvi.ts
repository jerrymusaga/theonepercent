import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

// Your specific Divvi consumer address from the docs
const DIVVI_CONSUMER_ADDRESS = '0xbe65D538E887D09a73354172c4411335fC2cbDb6';

/**
 * Generate a Divvi referral tag for a user address
 * @param userAddress - The wallet address of the user making the transaction
 * @returns Hex referral tag or default '0x' if generation fails
 */
export function getDivviReferralTag(userAddress: string): string {
  try {
    console.log('🔄 Generating Divvi referral tag for user:', userAddress);

    const referralTag = getReferralTag({
      user: userAddress as `0x${string}`,
      consumer: DIVVI_CONSUMER_ADDRESS,
    });

    console.log('✅ Divvi referral tag generated:', referralTag);
    return referralTag;
  } catch (error) {
    console.error('❌ Failed to generate Divvi referral tag:', error);
    return '0x'; // Default fallback
  }
}

/**
 * Track a completed transaction with Divvi
 * @param txHash - The transaction hash
 * @param chainId - The chain ID where the transaction was executed
 */
export async function trackDivviTransaction(txHash: string, chainId: number): Promise<void> {
  try {
    console.log('🔄 Tracking Divvi transaction:', {
      txHash,
      chainId,
      consumer: DIVVI_CONSUMER_ADDRESS
    });

    await submitReferral({
      txHash: txHash as `0x${string}`,
      chainId,
    });

    console.log('✅ Divvi transaction tracked successfully:', txHash);
  } catch (error) {
    console.error('❌ Failed to track Divvi transaction:', error);
    // Don't throw - transaction tracking failure shouldn't break the main flow
  }
}

/**
 * Get the Divvi consumer address for this app
 */
export function getDivviConsumerAddress(): string {
  return DIVVI_CONSUMER_ADDRESS;
}