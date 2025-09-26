import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { request } from '@/lib/graphql/client';
import {
  GET_POOLS,
  GET_POOL,
  GET_ACTIVE_POOLS,
  GET_OPEN_POOLS,
  SEARCH_POOLS,
} from '@/lib/graphql/queries';
import type {
  Pool,
  PoolsResponse,
  PoolResponse,
  PoolStatus,
  PoolFilter,
  OrderBy,
} from '@/lib/graphql/types';

// Get all pools with filtering and pagination
export function useEnvioPools(
  filter?: PoolFilter,
  orderBy?: OrderBy,
  first = 20,
  skip = 0
) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-pools', chainId, filter, orderBy, first, skip],
    queryFn: async () => {
      const response = await request<any>(GET_POOLS, {
        limit: first,
      });
      return response.pools || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get a specific pool by ID
export function useEnvioPool(poolId: string | undefined) {
  return useQuery({
    queryKey: ['envio-pool', poolId],
    queryFn: async () => {
      if (!poolId) return null;
      const response = await request<any>(GET_POOL, { id: poolId });
      return response.Pool_by_pk;
    },
    enabled: !!poolId,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get all active pools
export function useEnvioActivePools() {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-active-pools', chainId],
    queryFn: async () => {
      const response = await request<PoolsResponse>(GET_ACTIVE_POOLS, {
        chainId,
      });
      return response.pools || [];
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Get all open pools (waiting for players)
export function useEnvioOpenPools() {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-open-pools', chainId],
    queryFn: async () => {
      const response = await request<PoolsResponse>(GET_OPEN_POOLS, {
        chainId,
      });
      return response.pools || [];
    },
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
  });
}

// Search pools
export function useEnvioSearchPools(
  searchText: string,
  status?: PoolStatus,
  first = 20
) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-search-pools', searchText, status, chainId, first],
    queryFn: async () => {
      if (!searchText.trim()) return [];
      const response = await request<PoolsResponse>(SEARCH_POOLS, {
        searchText: searchText.toLowerCase(),
        status,
        chainId,
        first,
      });
      return response.pools || [];
    },
    enabled: !!searchText.trim(),
    staleTime: 30000, // 30 seconds
  });
}

// Combined hook that replaces useAllPools from the original implementation
export function useAllPools() {
  const chainId = useChainId();
  const queryClient = useQueryClient();

  const poolsQuery = useQuery({
    queryKey: ['envio-all-pools', chainId],
    queryFn: async () => {
      const response = await request<any>(GET_POOLS, {
        limit: 100,
      });
      return response.pools || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Provide refetch function compatible with existing code
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['envio-all-pools', chainId] });
    queryClient.invalidateQueries({ queryKey: ['envio-active-pools', chainId] });
    queryClient.invalidateQueries({ queryKey: ['envio-open-pools', chainId] });
  };

  return {
    data: poolsQuery.data || [],
    isLoading: poolsQuery.isLoading,
    error: poolsQuery.error,
    refetch,
  };
}

// Hook to get pools filtered by status (replaces status-specific hooks)
export function usePoolsByStatus(status: PoolStatus) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-pools-by-status', status, chainId],
    queryFn: async () => {
      const response = await request<any>(GET_POOLS, {
        first: 50,
        skip: 0,
        where: { status, chainId },
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      return response.pools || [];
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Hook to invalidate all pool-related queries (useful after mutations)
export function useInvalidatePools() {
  const queryClient = useQueryClient();
  const chainId = useChainId();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['envio-pools'] });
    queryClient.invalidateQueries({ queryKey: ['envio-pool'] });
    queryClient.invalidateQueries({ queryKey: ['envio-active-pools', chainId] });
    queryClient.invalidateQueries({ queryKey: ['envio-open-pools', chainId] });
    queryClient.invalidateQueries({ queryKey: ['envio-all-pools', chainId] });
  };
}