import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useCoinTossRead, useCoinTossWrite } from './use-contract';
import { PoolInfo, PoolStatus } from '@/lib/contract';

/**
 * Hook to get pool information
 */
export function usePoolInfo(poolId: number) {
  return useCoinTossRead('getPoolInfo', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: PoolInfo | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to get current pool ID (latest pool created)
 */
export function useCurrentPoolId() {
  return useCoinTossRead('currentPoolId') as {
    data: bigint | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to check if a pool can be activated
 */
export function useCanActivatePool(poolId: number) {
  return useCoinTossRead('canActivatePool', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook to check if a pool is abandoned
 */
export function useIsPoolAbandoned(poolId: number) {
  return useCoinTossRead('isPoolAbandoned', [BigInt(poolId)], {
    enabled: poolId > 0,
  }) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
  };
}

/**
 * Hook for creating a new pool
 */
export function useCreatePool() {
  const { writeContract, data: hash, isPending, error } = useCoinTossWrite();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPool = useMutation({
    mutationFn: async (params: { entryFee: string; maxPlayers: number }) => {
      if (!writeContract) throw new Error('Contract not available');
      
      return writeContract({
        functionName: 'createPool',
        args: [parseEther(params.entryFee), BigInt(params.maxPlayers)],
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['currentPoolId'] });
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['getCreatorInfo', address] });
        queryClient.invalidateQueries({ queryKey: ['getCreatedPools', address] });
      }
    },
  });

  return {
    createPool: createPool.mutate,
    createPoolAsync: createPool.mutateAsync,
    isPending: isPending || createPool.isPending,
    isConfirming,
    isConfirmed,
    error: error || createPool.error,
    hash,
  };
}

/**
 * Hook for joining a pool
 */
export function useJoinPool() {
  const { writeContract, data: hash, isPending, error } = useCoinTossWrite();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const joinPool = useMutation({
    mutationFn: async (params: { poolId: number; entryFee: string }) => {
      if (!writeContract) throw new Error('Contract not available');
      
      return writeContract({
        functionName: 'joinPool',
        args: [BigInt(params.poolId)],
        value: parseEther(params.entryFee),
      });
    },
    onSuccess: (_, { poolId }) => {
      // Invalidate pool info to refresh the data
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
    },
  });

  return {
    joinPool: joinPool.mutate,
    joinPoolAsync: joinPool.mutateAsync,
    isPending: isPending || joinPool.isPending,
    isConfirming,
    isConfirmed,
    error: error || joinPool.error,
    hash,
  };
}

/**
 * Hook for manually activating a pool
 */
export function useActivatePool() {
  const { writeContract, data: hash, isPending, error } = useCoinTossWrite();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const activatePool = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract) throw new Error('Contract not available');
      
      return writeContract({
        functionName: 'activatePool',
        args: [BigInt(poolId)],
      });
    },
    onSuccess: (_, poolId) => {
      // Invalidate pool info to refresh the data
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
    },
  });

  return {
    activatePool: activatePool.mutate,
    activatePoolAsync: activatePool.mutateAsync,
    isPending: isPending || activatePool.isPending,
    isConfirming,
    isConfirmed,
    error: error || activatePool.error,
    hash,
  };
}

/**
 * Hook to get multiple pools information (for pool listing)
 */
export function usePoolsList(poolIds: number[]) {
  // Create individual queries for each pool ID
  const poolQueries = poolIds.map(poolId => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePoolInfo(poolId);
  });

  const pools = poolQueries.map((query, index) => ({
    id: poolIds[index],
    ...query.data,
    isLoading: query.isLoading,
    error: query.error,
  })).filter(pool => pool.data);

  const isLoading = poolQueries.some(query => query.isLoading);
  const hasError = poolQueries.some(query => query.error);

  return {
    pools,
    isLoading,
    hasError,
    refetch: () => poolQueries.forEach(query => query.refetch()),
  };
}

/**
 * Hook to get all active pools (helper that combines multiple pool queries)
 */
export function useActivePools() {
  const { data: currentPoolId, isLoading: isLoadingCurrentId } = useCurrentPoolId();
  
  // Generate array of pool IDs to query (last 20 pools for example)
  const poolIds = currentPoolId 
    ? Array.from({ length: Math.min(Number(currentPoolId), 20) }, (_, i) => 
        Number(currentPoolId) - i
      ).filter(id => id > 0)
    : [];

  const poolsQuery = usePoolsList(poolIds);

  // Filter for only active/open pools
  const activePools = poolsQuery.pools.filter(pool => 
    pool.status === PoolStatus.OPENED || pool.status === PoolStatus.ACTIVE
  );

  return {
    pools: activePools,
    isLoading: isLoadingCurrentId || poolsQuery.isLoading,
    hasError: poolsQuery.hasError,
    refetch: poolsQuery.refetch,
  };
}

/**
 * Hook to get formatted pool data for display
 */
export function useFormattedPoolInfo(poolId: number) {
  const poolInfo = usePoolInfo(poolId);
  const canActivate = useCanActivatePool(poolId);
  const isAbandoned = useIsPoolAbandoned(poolId);

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
    canActivate: canActivate.data || false,
    isAbandoned: isAbandoned.data || false,
    isFull: Number(poolInfo.data.currentPlayers) >= Number(poolInfo.data.maxPlayers),
  };

  return {
    ...poolInfo,
    formattedData,
    isLoading: poolInfo.isLoading || canActivate.isLoading || isAbandoned.isLoading,
  };
}