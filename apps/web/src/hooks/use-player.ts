import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { useCoinTossRead, useContractAddress } from './use-contract';
import { PoolInfo, PoolStatus, CONTRACT_CONFIG } from '@/lib/contract';
import { useEffect, useState } from 'react';

/**
 * Interface for a pool that a player has joined
 */
export interface JoinedPool {
  id: number;
  poolInfo: PoolInfo;
  isEliminated: boolean;
  hasWon: boolean;
  hasClaimed: boolean;
  prizeAmount?: bigint;
  playerChoice?: number;
  formattedData: {
    id: number;
    entryFee: string;
    prizePool: string;
    status: PoolStatus;
    statusText: string;
    isWinner: boolean;
    canClaim: boolean;
  };
}

/**
 * Interface for claimable prizes
 */
export interface ClaimablePrize {
  poolId: number;
  amount: bigint;
  formattedAmount: string;
  poolInfo: PoolInfo;
}

/**
 * Interface for player statistics
 */
export interface PlayerStats {
  totalPoolsJoined: number;
  totalGamesWon: number;
  totalEarnings: string;
  winRate: string;
  activePools: number;
  claimablePrizes: number;
  totalClaimableAmount: string;
}

/**
 * Hook to get pools that a player has joined by querying PlayerJoined events
 */
export function usePlayerJoinedPools(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();

  return useQuery({
    queryKey: ['playerJoinedPools', targetAddress],
    queryFn: async () => {
      if (!publicClient || !contractAddress || !targetAddress) {
        return [];
      }

      try {
        // Get PlayerJoined events for this player
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: 'event',
            name: 'PlayerJoined',
            inputs: [
              { name: 'poolId', type: 'uint256', indexed: true },
              { name: 'player', type: 'address', indexed: true },
              { name: 'currentPlayers', type: 'uint256', indexed: false },
              { name: 'maxPlayers', type: 'uint256', indexed: false }
            ]
          },
          args: {
            player: targetAddress
          },
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        // Extract unique pool IDs
        const poolIds = [...new Set(logs.map(log => Number(log.args.poolId)))];

        return poolIds;
      } catch (error) {
        console.error('Error fetching player joined pools:', error);
        return [];
      }
    },
    enabled: !!targetAddress && !!publicClient && !!contractAddress,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get detailed information about pools a player has joined
 */
export function usePlayerPoolsDetails(address?: `0x${string}`) {
  const { data: poolIds = [], isLoading: isLoadingIds } = usePlayerJoinedPools(address);
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  // Get pool info for each joined pool
  const poolQueries = poolIds.map(poolId =>
    useCoinTossRead('getPoolInfo', [BigInt(poolId)], {
      enabled: poolId > 0,
    })
  );

  // Get player elimination status for each pool
  const eliminationQueries = poolIds.map(poolId =>
    useCoinTossRead('isPlayerEliminated', [BigInt(poolId), targetAddress], {
      enabled: poolId > 0 && !!targetAddress,
    })
  );

  // Get remaining players for each pool to check if player won
  const remainingPlayersQueries = poolIds.map(poolId =>
    useCoinTossRead('getRemainingPlayers', [BigInt(poolId)], {
      enabled: poolId > 0,
    })
  );

  const isLoading = isLoadingIds || poolQueries.some(q => q.isLoading) ||
                   eliminationQueries.some(q => q.isLoading) ||
                   remainingPlayersQueries.some(q => q.isLoading);

  const joinedPools: JoinedPool[] = poolIds.map((poolId, index) => {
    const poolQuery = poolQueries[index];
    const eliminationQuery = eliminationQueries[index];
    const remainingPlayersQuery = remainingPlayersQueries[index];

    if (!poolQuery.data) return null;

    const poolInfo: PoolInfo = {
      creator: (poolQuery.data as any)[0] as `0x${string}`,
      entryFee: (poolQuery.data as any)[1] as bigint,
      maxPlayers: (poolQuery.data as any)[2] as bigint,
      currentPlayers: (poolQuery.data as any)[3] as bigint,
      prizePool: (poolQuery.data as any)[4] as bigint,
      status: (poolQuery.data as any)[5] as PoolStatus,
    };

    const isEliminated = eliminationQuery.data || false;
    const remainingPlayers = remainingPlayersQuery.data as `0x${string}`[] || [];
    const hasWon = poolInfo.status === PoolStatus.COMPLETED &&
                   remainingPlayers.length === 1 &&
                   remainingPlayers[0] === targetAddress;

    const prizeAmount = hasWon ? poolInfo.prizePool - (poolInfo.prizePool * BigInt(5) / BigInt(100)) : undefined;

    return {
      id: poolId,
      poolInfo,
      isEliminated,
      hasWon,
      hasClaimed: false, // TODO: Track this via events or contract state
      prizeAmount,
      formattedData: {
        id: poolId,
        entryFee: formatEther(poolInfo.entryFee),
        prizePool: formatEther(poolInfo.prizePool),
        status: poolInfo.status,
        statusText: PoolStatus[poolInfo.status] as keyof typeof PoolStatus,
        isWinner: hasWon,
        canClaim: hasWon && !false, // TODO: Check actual claim status
      }
    };
  }).filter(Boolean) as JoinedPool[];

  return {
    pools: joinedPools,
    isLoading,
    poolIds,
  };
}

/**
 * Hook to get claimable prizes for a player
 */
export function usePlayerPrizes(address?: `0x${string}`) {
  const { pools, isLoading } = usePlayerPoolsDetails(address);

  const claimablePrizes: ClaimablePrize[] = pools
    .filter(pool => pool.hasWon && !pool.hasClaimed)
    .map(pool => ({
      poolId: pool.id,
      amount: pool.prizeAmount || BigInt(0),
      formattedAmount: formatEther(pool.prizeAmount || BigInt(0)),
      poolInfo: pool.poolInfo,
    }));

  const totalClaimable = claimablePrizes.reduce(
    (sum, prize) => sum + prize.amount,
    BigInt(0)
  );

  return {
    prizes: claimablePrizes,
    totalClaimable,
    totalClaimableFormatted: formatEther(totalClaimable),
    isLoading,
  };
}

/**
 * Hook to check if a player has ever joined any pools
 */
export function useHasJoinedPools(address?: `0x${string}`) {
  const { poolIds, isLoading } = usePlayerPoolsDetails(address);

  return {
    hasJoinedPools: poolIds.length > 0,
    isLoading,
  };
}

/**
 * Hook to get comprehensive player statistics
 */
export function usePlayerStats(address?: `0x${string}`) {
  const { pools, isLoading } = usePlayerPoolsDetails(address);
  const { totalClaimable, totalClaimableFormatted } = usePlayerPrizes(address);

  const stats: PlayerStats = {
    totalPoolsJoined: pools.length,
    totalGamesWon: pools.filter(pool => pool.hasWon).length,
    totalEarnings: pools
      .filter(pool => pool.hasWon && pool.hasClaimed)
      .reduce((sum, pool) => sum + Number(formatEther(pool.prizeAmount || BigInt(0))), 0)
      .toFixed(4),
    winRate: pools.length > 0
      ? ((pools.filter(pool => pool.hasWon).length / pools.length) * 100).toFixed(1)
      : '0',
    activePools: pools.filter(pool =>
      pool.poolInfo.status === PoolStatus.OPENED ||
      pool.poolInfo.status === PoolStatus.ACTIVE
    ).length,
    claimablePrizes: pools.filter(pool => pool.hasWon && !pool.hasClaimed).length,
    totalClaimableAmount: totalClaimableFormatted,
  };

  return {
    stats,
    isLoading,
  };
}

/**
 * Hook for claiming prize from a completed pool (player version)
 */
export function usePlayerClaimPrize() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPlayerPrize = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');

      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'claimPrize',
        args: [BigInt(poolId)],
      });
    },
    onSuccess: () => {
      // Invalidate player data to refresh
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['playerJoinedPools', address] });
        queryClient.invalidateQueries({ queryKey: ['playerPoolsDetails', address] });
      }
    },
  });

  return {
    claimPrize: claimPlayerPrize.mutate,
    claimPrizeAsync: claimPlayerPrize.mutateAsync,
    isPending: isPending || claimPlayerPrize.isPending,
    isConfirming,
    isConfirmed,
    error: error || claimPlayerPrize.error,
    hash,
  };
}

/**
 * Hook to get user participation status (creator, player, both, or none)
 */
export function useUserParticipation(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const creatorInfo = useCoinTossRead('getCreatorInfo', targetAddress ? [targetAddress] : undefined, {
    enabled: !!targetAddress,
  });

  const { hasJoinedPools, isLoading: isLoadingPools } = useHasJoinedPools(targetAddress);

  const isCreator = creatorInfo.data ? (creatorInfo.data as any)[3] as boolean : false; // hasActiveStake
  const isPlayer = hasJoinedPools;
  const isLoading = creatorInfo.isLoading || isLoadingPools;

  let userType: 'creator' | 'player' | 'both' | 'none' = 'none';

  if (isCreator && isPlayer) {
    userType = 'both';
  } else if (isCreator) {
    userType = 'creator';
  } else if (isPlayer) {
    userType = 'player';
  }

  return {
    userType,
    isCreator,
    isPlayer,
    hasParticipation: isCreator || isPlayer,
    isLoading,
  };
}

/**
 * Hook to get game results for pools where the player participated
 */
export function usePlayerGameResults(address?: `0x${string}`) {
  const { pools, isLoading } = usePlayerPoolsDetails(address);

  const completedPools = pools.filter(pool =>
    pool.poolInfo.status === PoolStatus.COMPLETED ||
    pool.poolInfo.status === PoolStatus.ABANDONED
  );

  const gameResults = completedPools.map(pool => ({
    poolId: pool.id,
    entryFee: formatEther(pool.poolInfo.entryFee),
    result: pool.hasWon ? 'won' : pool.isEliminated ? 'eliminated' : 'lost',
    prizeAmount: pool.hasWon ? formatEther(pool.prizeAmount || BigInt(0)) : '0',
    status: pool.poolInfo.status,
    canClaim: pool.hasWon && !pool.hasClaimed,
  }));

  return {
    gameResults,
    isLoading,
  };
}