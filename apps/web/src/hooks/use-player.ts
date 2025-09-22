import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt, useWriteContract, usePublicClient, useChainId } from 'wagmi';
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
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  return useQuery({
    queryKey: ['playerJoinedPools', targetAddress],
    queryFn: async () => {
      if (!publicClient || !contractAddress || !targetAddress) {
        return [];
      }

      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 100k blocks for mainnet, earliest for testnet
        const fromBlock = isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const;

        // First try to get events with timeout for faster fallback
        const logs = await Promise.race([
          publicClient.getLogs({
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
            fromBlock,
            toBlock: 'latest',
          }),
          // Timeout after 8 seconds to quickly fallback on mainnet
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
          )
        ]) as any[];

        // Extract unique pool IDs
        const poolIds = [...new Set(logs.map(log => Number(log.args.poolId)))];

        return poolIds;
      } catch (error) {
        // Return empty array for timeout or other errors
        return [];
      }
    },
    enabled: !!targetAddress && !!publicClient && !!contractAddress,
    staleTime: isMainnet ? 10000 : 30000, // 10s on mainnet, 30s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isMainnet ? 15000 : false, // Auto-refetch every 15s on mainnet
    refetchOnWindowFocus: true, // Always refetch when window gains focus
  });
}

/**
 * Hook to check if a player has claimed prize from a specific pool
 * Since there's no PrizeClaimed event, we check if prizePool is 0 after game completion
 */
export function useHasClaimedPrize(poolId: number, address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  return useQuery({
    queryKey: ['hasClaimedPrize', poolId, targetAddress],
    queryFn: async () => {
      if (!publicClient || !contractAddress || !targetAddress || poolId <= 0) {
        return false;
      }

      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 100k blocks for mainnet, earliest for testnet
        const fromBlock = isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const;

        // First check if there's a GameCompleted event for this pool with this winner
        const gameCompletedLogs = await Promise.race([
          publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'GameCompleted',
              inputs: [
                { name: 'poolId', type: 'uint256', indexed: true },
                { name: 'winner', type: 'address', indexed: true },
                { name: 'prizeAmount', type: 'uint256', indexed: false }
              ]
            },
            args: {
              poolId: BigInt(poolId),
              winner: targetAddress
            },
            fromBlock,
            toBlock: 'latest',
          }),
          // Timeout after 8 seconds to quickly fallback on mainnet
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
          )
        ]) as any[];

        // If no GameCompleted event with this winner, they didn't win
        if (gameCompletedLogs.length === 0) {
          return false;
        }

        // If they won, check if the prize has been claimed by reading pool info
        const poolInfo = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getPoolInfo',
          args: [BigInt(poolId)],
        });

        // If prizePool is 0, the prize has been claimed
        const prizePool = (poolInfo as unknown as any[])[4] as bigint;
        return prizePool === BigInt(0);

      } catch (error) {
        // Return false for timeout or other errors
        return false;
      }
    },
    enabled: !!targetAddress && !!publicClient && !!contractAddress && poolId > 0,
    staleTime: isMainnet ? 10000 : 30000, // 10s on mainnet, 30s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isMainnet ? 15000 : false, // Auto-refetch every 15s on mainnet
    refetchOnWindowFocus: true, // Always refetch when window gains focus
  });
}

/**
 * Hook to get detailed information about pools a player has joined
 */
export function usePlayerPoolsDetails(address?: `0x${string}`) {
  const { data: poolIds = [], isLoading: isLoadingIds } = usePlayerJoinedPools(address);
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  const { data: joinedPools = [], isLoading: isPoolsLoading } = useQuery({
    queryKey: ['playerPoolsDetails', targetAddress, poolIds],
    queryFn: async () => {
      if (!poolIds.length || !targetAddress || !publicClient || !contractAddress) {
        return [];
      }

      try {
        // Prepare batch contract calls for all pools
        const poolInfoCalls = poolIds.map(poolId => ({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getPoolInfo',
          args: [BigInt(poolId)]
        }));

        const eliminationCalls = poolIds.map(poolId => ({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'isPlayerEliminated',
          args: [BigInt(poolId), targetAddress]
        }));

        const remainingPlayersCalls = poolIds.map(poolId => ({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getRemainingPlayers',
          args: [BigInt(poolId)]
        }));

        // Check if player won any of these pools by looking for GameCompleted events
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const;

        const gameCompletedChecks = await Promise.all(
          poolIds.map(async (poolId) => {
            try {
              const logs = await Promise.race([
                publicClient.getLogs({
                  address: contractAddress,
                  event: {
                    type: 'event',
                    name: 'GameCompleted',
                    inputs: [
                      { name: 'poolId', type: 'uint256', indexed: true },
                      { name: 'winner', type: 'address', indexed: true },
                      { name: 'prizeAmount', type: 'uint256', indexed: false }
                    ]
                  },
                  args: {
                    poolId: BigInt(poolId),
                    winner: targetAddress
                  },
                  fromBlock,
                  toBlock: 'latest',
                }),
                // Timeout after 8 seconds to quickly fallback on mainnet
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
                )
              ]) as any[];
              return logs.length > 0;
            } catch (error) {
              // Return false for timeout or other errors
              return false;
            }
          })
        );

        // Execute all calls in batches
        const [poolInfoResults, eliminationResults, remainingPlayersResults] = await Promise.all([
          publicClient.multicall({ contracts: poolInfoCalls as any }),
          publicClient.multicall({ contracts: eliminationCalls as any }),
          publicClient.multicall({ contracts: remainingPlayersCalls as any })
        ]);

        // Process results into JoinedPool objects
        const joinedPools: JoinedPool[] = poolIds.map((poolId, index) => {
          const poolInfoResult = poolInfoResults[index];
          const eliminationResult = eliminationResults[index];
          const remainingPlayersResult = remainingPlayersResults[index];

          // Skip if pool info failed to load
          if (poolInfoResult.status !== 'success' || !poolInfoResult.result) {
            return null;
          }

          const poolData = poolInfoResult.result as any[];
          const poolInfo: PoolInfo = {
            creator: poolData[0] as `0x${string}`,
            entryFee: poolData[1] as bigint,
            maxPlayers: poolData[2] as bigint,
            currentPlayers: poolData[3] as bigint,
            prizePool: poolData[4] as bigint,
            status: poolData[5] as PoolStatus,
          };

          const isEliminated = eliminationResult.status === 'success' ?
            (eliminationResult.result as boolean) : false;

          const remainingPlayers = remainingPlayersResult.status === 'success' ?
            (remainingPlayersResult.result as `0x${string}`[]) : [];

          // Check if player won using GameCompleted events (more reliable than pool state)
          const hasWonFromEvent = gameCompletedChecks[index] || false;

          // Also check pool state for completeness
          const hasWonFromState = poolInfo.status === PoolStatus.COMPLETED &&
                                  remainingPlayers.length === 1 &&
                                  remainingPlayers[0]?.toLowerCase() === targetAddress.toLowerCase();

          const hasWon = hasWonFromEvent || hasWonFromState;

          // Calculate prize amount (total pool minus 5% creator fee)
          const prizeAmount = hasWon ?
            poolInfo.prizePool - (poolInfo.prizePool * BigInt(5) / BigInt(100)) :
            undefined;

          // Check if prize has been claimed: if player won but prizePool is 0, it's been claimed
          const hasClaimed = hasWon && poolInfo.prizePool === BigInt(0);

          const getStatusText = (status: PoolStatus): string => {
            switch (status) {
              case PoolStatus.OPENED: return 'OPENED';
              case PoolStatus.ACTIVE: return 'ACTIVE';
              case PoolStatus.COMPLETED: return 'COMPLETED';
              case PoolStatus.ABANDONED: return 'ABANDONED';
              default: return 'UNKNOWN';
            }
          };

          return {
            id: poolId,
            poolInfo,
            isEliminated,
            hasWon,
            hasClaimed,
            prizeAmount,
            formattedData: {
              id: poolId,
              entryFee: formatEther(poolInfo.entryFee),
              prizePool: formatEther(poolInfo.prizePool),
              status: poolInfo.status,
              statusText: getStatusText(poolInfo.status),
              isWinner: hasWon,
              canClaim: hasWon && !hasClaimed,
            }
          };
        }).filter(Boolean) as JoinedPool[];

        return joinedPools;

      } catch (error) {
        // Return empty array for timeout or other errors
        return [];
      }
    },
    enabled: !!targetAddress && poolIds.length > 0 && !isLoadingIds && !!publicClient && !!contractAddress,
    staleTime: isMainnet ? 10000 : 30000, // 10s on mainnet, 30s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isMainnet ? 15000 : false, // Auto-refetch every 15s on mainnet
    refetchOnWindowFocus: true, // Always refetch when window gains focus
  });

  return {
    pools: joinedPools,
    isLoading: isLoadingIds || isPoolsLoading,
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
  const { totalClaimableFormatted } = usePlayerPrizes(address);

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
    onSuccess: (_, poolId) => {
      // Invalidate player data to refresh
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['playerJoinedPools', address] });
        queryClient.invalidateQueries({ queryKey: ['playerPoolsDetails', address] });
        queryClient.invalidateQueries({ queryKey: ['hasClaimedPrize', poolId, address] });
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
 * Hook to get all pools created by a specific address
 */
export function useCreatedPools(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  return useQuery({
    queryKey: ['createdPools', targetAddress],
    queryFn: async () => {
      if (!publicClient || !contractAddress || !targetAddress) {
        return [];
      }

      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 100k blocks for mainnet, earliest for testnet
        const fromBlock = isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const;

        // Get PoolCreated events for this creator with timeout
        const logs = await Promise.race([
          publicClient.getLogs({
            address: contractAddress,
            event: {
              type: 'event',
              name: 'PoolCreated',
              inputs: [
                { name: 'poolId', type: 'uint256', indexed: true },
                { name: 'creator', type: 'address', indexed: true },
                { name: 'entryFee', type: 'uint256', indexed: false },
                { name: 'maxPlayers', type: 'uint256', indexed: false }
              ]
            },
            args: {
              creator: targetAddress
            },
            fromBlock,
            toBlock: 'latest',
          }),
          // Timeout after 8 seconds to quickly fallback on mainnet
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
          )
        ]) as any[];

        // Extract pool IDs and sort by most recent first
        const poolIds = logs
          .map(log => Number(log.args.poolId))
          .sort((a, b) => b - a); // Newest first

        return poolIds;
      } catch (error) {
        // Return empty array for timeout or other errors
        return [];
      }
    },
    enabled: !!targetAddress && !!publicClient && !!contractAddress,
    staleTime: isMainnet ? 10000 : 30000, // 10s on mainnet, 30s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isMainnet ? 15000 : false, // Auto-refetch every 15s on mainnet
    refetchOnWindowFocus: true, // Always refetch when window gains focus
  });
}

/**
 * Hook to check if address has ever created pools (historical creator status)
 */
export function useHasCreatedPools(address?: `0x${string}`) {
  const { data: createdPools, isLoading } = useCreatedPools(address);

  return {
    data: (createdPools?.length || 0) > 0,
    isLoading,
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
  const { data: hasCreatedPools, isLoading: isLoadingCreated } = useHasCreatedPools(targetAddress);

  // Creator status: either has active stake OR has created pools historically
  const hasActiveStake = creatorInfo.data ? (creatorInfo.data as any)[3] as boolean : false;
  const isCreator = hasActiveStake || hasCreatedPools || false;
  const isPlayer = hasJoinedPools;
  const isLoading = creatorInfo.isLoading || isLoadingPools || isLoadingCreated;

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
    hasActiveStake, // Expose current stake status separately
    hasCreatedPools: hasCreatedPools || false,
    hasParticipation: isCreator || isPlayer,
    isLoading,
  };
}

/**
 * Hook for claiming refund from abandoned pools (player version)
 */
export function useClaimAbandonedPoolRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const claimRefund = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');

      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'claimRefundFromAbandonedPool',
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
    claimRefund: claimRefund.mutate,
    claimRefundAsync: claimRefund.mutateAsync,
    isPending: isPending || claimRefund.isPending,
    isConfirming,
    isConfirmed,
    error: error || claimRefund.error,
    hash,
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