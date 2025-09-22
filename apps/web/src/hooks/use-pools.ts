import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useCoinTossRead, useContractAddress } from './use-contract';
import { PoolInfo, PoolStatus, CONTRACT_CONFIG } from '@/lib/contract';

/**
 * Hook to get pool information
 */
export function usePoolInfo(poolId: number) {
  const result = useCoinTossRead('getPoolInfo', [BigInt(poolId)], {
    enabled: poolId > 0,
  });

  // Transform array response to PoolInfo object
  const transformedResult = {
    ...result,
    data: result.data ? {
      creator: (result.data as any)[0] as `0x${string}`,
      entryFee: (result.data as any)[1] as bigint,
      maxPlayers: (result.data as any)[2] as bigint,
      currentPlayers: (result.data as any)[3] as bigint,
      prizePool: (result.data as any)[4] as bigint,
      status: (result.data as any)[5] as PoolStatus,
    } as PoolInfo : undefined
  };

  return transformedResult as {
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
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createPool = useMutation({
    mutationFn: async (params: { entryFee: string; maxPlayers: number }) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');
      
      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
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
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const joinPool = useMutation({
    mutationFn: async (params: { poolId: number; entryFee: string }) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');

      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'joinPool',
        args: [BigInt(params.poolId)],
        value: parseEther(params.entryFee),
      });
    },
    onSuccess: (_, { poolId }) => {
      // Invalidate pool info to refresh the data
      queryClient.invalidateQueries({ queryKey: ['getPoolInfo', poolId] });
      // Force refresh of joined players data
      queryClient.invalidateQueries({ queryKey: ['joinedPlayers', poolId] });
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
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const activatePool = useMutation({
    mutationFn: async (poolId: number) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');
      
      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
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
  // Call hooks at the top level (maximum 20 pools supported)
  const pool0 = usePoolInfo(poolIds[0] || 0);
  const pool1 = usePoolInfo(poolIds[1] || 0);
  const pool2 = usePoolInfo(poolIds[2] || 0);
  const pool3 = usePoolInfo(poolIds[3] || 0);
  const pool4 = usePoolInfo(poolIds[4] || 0);
  const pool5 = usePoolInfo(poolIds[5] || 0);
  const pool6 = usePoolInfo(poolIds[6] || 0);
  const pool7 = usePoolInfo(poolIds[7] || 0);
  const pool8 = usePoolInfo(poolIds[8] || 0);
  const pool9 = usePoolInfo(poolIds[9] || 0);
  const pool10 = usePoolInfo(poolIds[10] || 0);
  const pool11 = usePoolInfo(poolIds[11] || 0);
  const pool12 = usePoolInfo(poolIds[12] || 0);
  const pool13 = usePoolInfo(poolIds[13] || 0);
  const pool14 = usePoolInfo(poolIds[14] || 0);
  const pool15 = usePoolInfo(poolIds[15] || 0);
  const pool16 = usePoolInfo(poolIds[16] || 0);
  const pool17 = usePoolInfo(poolIds[17] || 0);
  const pool18 = usePoolInfo(poolIds[18] || 0);
  const pool19 = usePoolInfo(poolIds[19] || 0);

  const queries = [
    pool0, pool1, pool2, pool3, pool4, pool5, pool6, pool7, pool8, pool9,
    pool10, pool11, pool12, pool13, pool14, pool15, pool16, pool17, pool18, pool19
  ];

  const pools = poolIds.map((poolId, index) => {
    const query = queries[index];
    return {
      id: poolId,
      data: query?.data,
      isLoading: query?.isLoading || false,
      error: query?.error || null,
    };
  }).filter(pool => pool.data); // Only include pools with valid data

  const isLoading = queries.slice(0, poolIds.length).some(query => query?.isLoading);
  const hasError = queries.slice(0, poolIds.length).some(query => query?.error);

  return {
    pools,
    isLoading,
    hasError,
    refetch: () => queries.slice(0, poolIds.length).forEach(query => query?.refetch?.()),
  };
}

/**
 * Hook to get all pools regardless of status (for pools page with filters)
 */
export function useAllPools() {
  const { data: currentPoolId, isLoading: isLoadingCurrentId } = useCurrentPoolId();

  // Generate array of pool IDs to query (last 20 pools for example)
  const poolIds = currentPoolId && Number(currentPoolId) > 0
    ? Array.from({ length: Math.min(Number(currentPoolId), 20) }, (_, i) =>
        Number(currentPoolId) - i
      ).filter(id => id > 0)
    : [];

  const poolsQuery = usePoolsList(poolIds);

  // Return all pools with data (no status filtering)
  const allPools = poolsQuery.pools.filter(pool => pool.data);

  return {
    pools: allPools,
    isLoading: isLoadingCurrentId || poolsQuery.isLoading,
    hasError: poolsQuery.hasError,
    refetch: poolsQuery.refetch,
  };
}

/**
 * Hook to get all active pools (helper that combines multiple pool queries)
 */
export function useActivePools() {
  const { data: currentPoolId, isLoading: isLoadingCurrentId } = useCurrentPoolId();

  // Generate array of pool IDs to query (last 20 pools for example)
  const poolIds = currentPoolId && Number(currentPoolId) > 0
    ? Array.from({ length: Math.min(Number(currentPoolId), 20) }, (_, i) =>
        Number(currentPoolId) - i
      ).filter(id => id > 0)
    : [];

  const poolsQuery = usePoolsList(poolIds);

  // Filter for only active/open pools
  const activePools = poolsQuery.pools.filter(pool =>
    pool.data && (pool.data.status === PoolStatus.OPENED || pool.data.status === PoolStatus.ACTIVE)
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