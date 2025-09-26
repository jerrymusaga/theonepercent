import { useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { useAllPools as useAllPoolsEnvio, useEnvioPool } from './use-envio-pools';
import { PoolStatus } from '@/lib/contract';

/**
 * Migration wrapper: useAllPools with Envio backend
 * Maintains same interface as original but uses Envio data
 */
export function useAllPools() {
  const { data: pools = [], isLoading, error, refetch } = useAllPoolsEnvio();

  // Transform Envio data to match old interface
  const transformedPools = (pools as any[]).map((pool: any) => ({
    id: parseInt(pool.id),
    data: pool ? {
      creator: pool.creator_id as `0x${string}`,
      entryFee: BigInt(pool.entryFee),
      maxPlayers: BigInt(pool.maxPlayers),
      currentPlayers: BigInt(pool.currentPlayers),
      prizePool: BigInt(pool.prizePool),
      status: mapStatusFromEnvio(pool.status) as PoolStatus,
    } : undefined,
    isLoading: false,
    error: null,
  })).filter(pool => pool.data);

  return {
    pools: transformedPools,
    isLoading,
    hasError: !!error,
    refetch,
  };
}

/**
 * Migration wrapper: useActivePools with Envio backend
 */
export function useActivePools() {
  const { data: pools = [], isLoading, error, refetch } = useAllPoolsEnvio();

  // Filter for active/open pools and transform
  const activePools = pools
    .filter((pool: any) =>
      pool.status === 'WAITING_FOR_PLAYERS' || pool.status === 'ACTIVE'
    )
    .map((pool: any) => ({
      id: parseInt(pool.id),
      data: {
        creator: pool.creator_id as `0x${string}`,
        entryFee: BigInt(pool.entryFee),
        maxPlayers: BigInt(pool.maxPlayers),
        currentPlayers: BigInt(pool.currentPlayers),
        prizePool: BigInt(pool.prizePool),
        status: mapStatusFromEnvio(pool.status) as PoolStatus,
      },
      isLoading: false,
      error: null,
    }));

  return {
    pools: activePools,
    isLoading,
    hasError: !!error,
    refetch,
  };
}

/**
 * Migration wrapper: usePoolInfo with Envio backend
 */
export function usePoolInfo(poolId: number) {
  const { data: pool, isLoading, error, refetch } = useEnvioPool(poolId?.toString());

  const transformedResult = {
    data: pool ? {
      creator: pool.creator_id as `0x${string}`,
      entryFee: BigInt(pool.entryFee),
      maxPlayers: BigInt(pool.maxPlayers),
      currentPlayers: BigInt(pool.currentPlayers),
      prizePool: BigInt(pool.prizePool),
      status: mapStatusFromEnvio(pool.status) as PoolStatus,
    } : undefined,
    isLoading,
    error,
    refetch,
  };

  return transformedResult;
}

/**
 * Migration wrapper: useFormattedPoolInfo with Envio backend
 */
export function useFormattedPoolInfo(poolId: number) {
  const poolInfo = usePoolInfo(poolId);

  if (!poolInfo.data) {
    return {
      ...poolInfo,
      formattedData: null,
    };
  }

  const formattedData = {
    id: poolId,
    creator: poolInfo.data.creator,
    entryFee: formatEther(poolInfo.data.entryFee),
    maxPlayers: Number(poolInfo.data.maxPlayers),
    currentPlayers: Number(poolInfo.data.currentPlayers),
    prizePool: formatEther(poolInfo.data.prizePool),
    status: poolInfo.data.status,
    statusText: PoolStatus[poolInfo.data.status] as keyof typeof PoolStatus,
    fillPercentage: (Number(poolInfo.data.currentPlayers) / Number(poolInfo.data.maxPlayers)) * 100,
    canActivate: poolInfo.data.status === PoolStatus.OPENED && Number(poolInfo.data.currentPlayers) >= Number(poolInfo.data.maxPlayers),
    isAbandoned: poolInfo.data.status === PoolStatus.ABANDONED,
    isFull: Number(poolInfo.data.currentPlayers) >= Number(poolInfo.data.maxPlayers),
  };

  return {
    ...poolInfo,
    formattedData,
  };
}

// Helper function to map Envio status to contract PoolStatus enum
function mapStatusFromEnvio(envioStatus: string): PoolStatus {
  switch (envioStatus) {
    case 'WAITING_FOR_PLAYERS': return PoolStatus.OPENED;
    case 'ACTIVE': return PoolStatus.ACTIVE;
    case 'COMPLETED': return PoolStatus.COMPLETED;
    case 'ABANDONED': return PoolStatus.ABANDONED;
    default: return PoolStatus.OPENED;
  }
}

// Re-export write operations from original hooks (these don't change)
export {
  useCreatePool,
  useJoinPool,
  useActivatePool,
  useCurrentPoolId,
  useCanActivatePool,
  useIsPoolAbandoned
} from './use-pools';