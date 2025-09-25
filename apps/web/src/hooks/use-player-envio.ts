import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useEnvioPlayer, useEnvioPlayerPools, useEnvioHasPlayerJoined } from './use-envio-players';
import { useEnvioCreator } from './use-envio-creators';
import { PoolStatus } from '@/lib/contract';
import { JoinedPool, PlayerStats, ClaimablePrize } from './use-player';

/**
 * Migration wrapper: usePlayerPoolsDetails with Envio backend
 * Maintains same interface as original but uses Envio data
 */
export function usePlayerPoolsDetails(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: playerPools = [], isLoading } = useEnvioPlayerPools(targetAddress);

  // Transform Envio data to match old interface
  const transformedPools: JoinedPool[] = playerPools.map((playerPool: any) => {
    const pool = playerPool.pool;

    // Map Envio status to contract status
    const getPoolStatus = (status: string): PoolStatus => {
      switch (status) {
        case 'WAITING_FOR_PLAYERS': return PoolStatus.OPENED;
        case 'ACTIVE': return PoolStatus.ACTIVE;
        case 'COMPLETED': return PoolStatus.COMPLETED;
        case 'ABANDONED': return PoolStatus.ABANDONED;
        default: return PoolStatus.OPENED;
      }
    };

    const poolStatus = getPoolStatus(pool.status);
    const hasWon = playerPool.hasWon || false;
    const isEliminated = playerPool.isEliminated || false;
    const hasClaimed = playerPool.prizeClaimed || false;
    const prizeAmount = hasWon ? BigInt(playerPool.prizeAmount || '0') : undefined;

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
      id: parseInt(pool.id),
      poolInfo: {
        creator: pool.creator?.address || pool.creator_id as `0x${string}`,
        entryFee: BigInt(pool.entryFee),
        maxPlayers: BigInt(pool.maxPlayers),
        currentPlayers: BigInt(pool.currentPlayers),
        prizePool: BigInt(pool.prizePool),
        status: poolStatus,
      },
      isEliminated,
      hasWon,
      hasClaimed,
      prizeAmount,
      formattedData: {
        id: parseInt(pool.id),
        entryFee: formatEther(pool.entryFee),
        prizePool: formatEther(pool.prizePool),
        status: poolStatus,
        statusText: getStatusText(poolStatus),
        isWinner: hasWon,
        canClaim: hasWon && !hasClaimed,
      }
    };
  });

  return {
    pools: transformedPools,
    isLoading,
    poolIds: transformedPools.map(p => p.id),
  };
}

/**
 * Migration wrapper: usePlayerPrizes with Envio backend
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
 * Migration wrapper: usePlayerStats with Envio backend
 */
export function usePlayerStats(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: player, isLoading: isPlayerLoading } = useEnvioPlayer(targetAddress);
  const { totalClaimableFormatted } = usePlayerPrizes(targetAddress);
  const { pools, isLoading: isPoolsLoading } = usePlayerPoolsDetails(targetAddress);

  const isLoading = isPlayerLoading || isPoolsLoading;

  const stats: PlayerStats = {
    totalPoolsJoined: player?.totalPoolsJoined || pools.length,
    totalGamesWon: player?.totalPoolsWon || pools.filter(pool => pool.hasWon).length,
    totalEarnings: formatEther(BigInt(player?.totalEarnings || '0')),
    winRate: player && player.totalPoolsJoined > 0
      ? ((player.totalPoolsWon / player.totalPoolsJoined) * 100).toFixed(1)
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
 * Migration wrapper: useHasJoinedPools with Envio backend
 */
export function useHasJoinedPools(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: player, isLoading } = useEnvioPlayer(targetAddress);

  return {
    hasJoinedPools: (player?.totalPoolsJoined || 0) > 0,
    isLoading,
  };
}

/**
 * Migration wrapper: useUserParticipation with Envio backend
 */
export function useUserParticipation(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data: player, isLoading: isPlayerLoading } = useEnvioPlayer(targetAddress);
  const { data: creator, isLoading: isCreatorLoading } = useEnvioCreator(targetAddress);

  const isLoading = isPlayerLoading || isCreatorLoading;

  const hasJoinedPools = (player?.totalPoolsJoined || 0) > 0;
  const hasCreatedPools = (creator?.totalPoolsCreated || 0) > 0;
  const hasActiveStake = (creator && BigInt(creator.totalStaked) > 0n) || false;

  const isCreator = hasActiveStake || hasCreatedPools;
  const isPlayer = hasJoinedPools;

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
    hasActiveStake,
    hasCreatedPools,
    hasParticipation: isCreator || isPlayer,
    isLoading,
  };
}

/**
 * Migration wrapper: usePlayerGameResults with Envio backend
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

// Re-export write operations from original hooks (these don't change)
export {
  usePlayerClaimPrize,
  useClaimAbandonedPoolRefund,
} from './use-player';