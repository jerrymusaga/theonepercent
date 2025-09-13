import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useCoinTossRead, useCoinTossWrite } from './use-contract';
import { CreatorInfo } from '@/lib/contract';

/**
 * Hook to get creator staking information
 */
export function useCreatorInfo(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  return useCoinTossRead('getCreatorInfo', targetAddress ? [targetAddress] : undefined, {
    enabled: !!targetAddress,
  }) as {
    data: CreatorInfo | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to calculate pools eligible for a stake amount
 */
export function useCalculatePoolsEligible(stakeAmount: string) {
  return useCoinTossRead(
    'calculatePoolsEligible',
    stakeAmount ? [parseEther(stakeAmount)] : undefined,
    { enabled: !!stakeAmount && parseFloat(stakeAmount) > 0 }
  ) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to calculate creator rewards
 */
export function useCreatorReward(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  return useCoinTossRead('calculateCreatorReward', targetAddress ? [targetAddress] : undefined, {
    enabled: !!targetAddress,
  }) as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to check if all pools are completed for a creator
 */
export function useAreAllPoolsCompleted(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  return useCoinTossRead('areAllPoolsCompleted', targetAddress ? [targetAddress] : undefined, {
    enabled: !!targetAddress,
  }) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to get created pools for a creator
 */
export function useCreatedPools(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  return useCoinTossRead('getCreatedPools', targetAddress ? [targetAddress] : undefined, {
    enabled: !!targetAddress,
  }) as {
    data: bigint[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook for staking CELO for pool creation
 */
export function useStakeForPoolCreation() {
  const { writeContract, data: hash, isPending, error } = useCoinTossWrite();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const stake = useMutation({
    mutationFn: async (stakeAmount: string) => {
      if (!writeContract) throw new Error('Contract not available');
      
      return writeContract({
        functionName: 'stakeForPoolCreation',
        value: parseEther(stakeAmount),
      });
    },
    onSuccess: () => {
      // Invalidate creator info to refresh the data
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['getCreatorInfo', address] });
      }
    },
  });

  return {
    stake: stake.mutate,
    stakeAsync: stake.mutateAsync,
    isPending: isPending || stake.isPending,
    isConfirming,
    isConfirmed,
    error: error || stake.error,
    hash,
  };
}

/**
 * Hook for unstaking and claiming rewards
 */
export function useUnstakeAndClaim() {
  const { writeContract, data: hash, isPending, error } = useCoinTossWrite();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const unstake = useMutation({
    mutationFn: async () => {
      if (!writeContract) throw new Error('Contract not available');
      
      return writeContract({
        functionName: 'unstakeAndClaim',
      });
    },
    onSuccess: () => {
      // Invalidate creator info to refresh the data
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['getCreatorInfo', address] });
        queryClient.invalidateQueries({ queryKey: ['calculateCreatorReward', address] });
      }
    },
  });

  return {
    unstake: unstake.mutate,
    unstakeAsync: unstake.mutateAsync,
    isPending: isPending || unstake.isPending,
    isConfirming,
    isConfirmed,
    error: error || unstake.error,
    hash,
  };
}

/**
 * Hook to get staking statistics (formatted for display)
 */
export function useStakingStats(address?: `0x${string}`) {
  const creatorInfo = useCreatorInfo(address);
  const creatorReward = useCreatorReward(address);
  const allPoolsCompleted = useAreAllPoolsCompleted(address);
  
  const stats = {
    stakedAmount: creatorInfo.data ? formatEther(creatorInfo.data.stakedAmount) : '0',
    poolsCreated: creatorInfo.data ? Number(creatorInfo.data.poolsCreated) : 0,
    poolsRemaining: creatorInfo.data ? Number(creatorInfo.data.poolsRemaining) : 0,
    hasActiveStake: creatorInfo.data?.hasActiveStake || false,
    totalReward: creatorReward.data ? formatEther(creatorReward.data) : '0',
    canUnstake: allPoolsCompleted.data || false,
    isLoading: creatorInfo.isLoading || creatorReward.isLoading || allPoolsCompleted.isLoading,
  };

  return stats;
}