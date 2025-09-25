import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChainId } from 'wagmi';
import { request } from '@/lib/graphql/client';
import {
  GET_CREATOR,
  GET_CREATOR_STATS,
  GET_TOP_CREATORS,
} from '@/lib/graphql/queries';
import type {
  Creator,
  CreatorResponse,
  CreatorsResponse,
} from '@/lib/graphql/types';

// Get a specific creator by address
export function useEnvioCreator(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-creator', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await request<CreatorResponse>(GET_CREATOR, {
        id: address.toLowerCase()
      });
      return response.creator;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get creator statistics (lighter version)
export function useEnvioCreatorStats(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-creator-stats', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await request<CreatorResponse>(GET_CREATOR_STATS, {
        address: address.toLowerCase()
      });
      return response.creator;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get creator's pools
export function useEnvioCreatorPools(creatorAddress: string | undefined) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-creator-pools', creatorAddress, chainId],
    queryFn: async () => {
      if (!creatorAddress) return [];

      const query = `
        query GetCreatorPools($creatorAddress: String!, $chainId: Int) {
          pools(
            where: {
              creator: $creatorAddress,
              chainId: $chainId
            }
            orderBy: createdAt
            orderDirection: desc
          ) {
            id
            status
            entryFee
            maxPlayers
            currentPlayers
            prizePool
            currentRound
            winner {
              id
              address
            }
            prizeAmount
            createdAt
            activatedAt
            completedAt
            chainId
          }
        }
      `;

      const response = await request<{ pools: any[] }>(query, {
        creatorAddress: creatorAddress.toLowerCase(),
        chainId,
      });
      return response.pools;
    },
    enabled: !!creatorAddress,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get top creators leaderboard
export function useEnvioTopCreators(first = 10) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-top-creators', first, chainId],
    queryFn: async () => {
      const response = await request<CreatorsResponse>(GET_TOP_CREATORS, {
        first,
        chainId,
      });
      return response.creators;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
}

// Check if address is a creator (has staked)
export function useEnvioIsCreator(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-is-creator', address],
    queryFn: async () => {
      if (!address) return false;

      const query = `
        query IsCreator($address: String!) {
          creator(id: $address) {
            id
            totalStaked
            totalPoolsEligible
          }
        }
      `;

      const response = await request<{ creator: Creator | null }>(query, {
        address: address.toLowerCase(),
      });

      return !!(response.creator && BigInt(response.creator.totalStaked) > 0n);
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Get creator earnings breakdown
export function useEnvioCreatorEarnings(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-creator-earnings', address],
    queryFn: async () => {
      if (!address) return null;

      const query = `
        query GetCreatorEarnings($address: String!) {
          creator(id: $address) {
            id
            totalEarned
            totalStaked
            completedPools
            pools(where: { status: COMPLETED }) {
              id
              prizeAmount
              completedAt
              winner {
                id
                address
              }
            }
            stakes: stakeEvents {
              id
              stakeType
              amount
              penalty
              timestamp
            }
          }
        }
      `;

      const response = await request<{ creator: any }>(query, {
        address: address.toLowerCase(),
      });

      return response.creator;
    },
    enabled: !!address,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });
}

// Get creator verification status
export function useEnvioCreatorVerification(address: string | undefined) {
  return useQuery({
    queryKey: ['envio-creator-verification', address],
    queryFn: async () => {
      if (!address) return null;

      const query = `
        query GetCreatorVerification($address: String!) {
          creator(id: $address) {
            id
            isVerified
            verifiedAt
            attestationId
            verificationBonusPools
          }
        }
      `;

      const response = await request<{ creator: any }>(query, {
        address: address.toLowerCase(),
      });

      return response.creator;
    },
    enabled: !!address,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });
}

// Get creator's active pools count
export function useEnvioCreatorActivePools(address: string | undefined) {
  const chainId = useChainId();

  return useQuery({
    queryKey: ['envio-creator-active-pools', address, chainId],
    queryFn: async () => {
      if (!address) return 0;

      const query = `
        query GetCreatorActivePools($address: String!, $chainId: Int) {
          pools(
            where: {
              creator: $address,
              status_in: [OPENED, ACTIVE],
              chainId: $chainId
            }
          ) {
            id
          }
        }
      `;

      const response = await request<{ pools: { id: string }[] }>(query, {
        address: address.toLowerCase(),
        chainId,
      });

      return response.pools.length;
    },
    enabled: !!address,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Combined hook that replaces the original useCreatorInfo
export function useCreatorInfo(address: string | undefined) {
  const creatorQuery = useEnvioCreator(address);
  const verificationQuery = useEnvioCreatorVerification(address);
  const activePoolsQuery = useEnvioCreatorActivePools(address);

  const queryClient = useQueryClient();
  const chainId = useChainId();

  // Provide refetch function compatible with existing code
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['envio-creator', address] });
    queryClient.invalidateQueries({ queryKey: ['envio-creator-stats', address] });
    queryClient.invalidateQueries({ queryKey: ['envio-creator-verification', address] });
    queryClient.invalidateQueries({ queryKey: ['envio-creator-active-pools', address, chainId] });
  };

  return {
    data: creatorQuery.data,
    verification: verificationQuery.data,
    activePools: activePoolsQuery.data || 0,
    isLoading: creatorQuery.isLoading || verificationQuery.isLoading,
    error: creatorQuery.error || verificationQuery.error,
    refetch,
  };
}

// Hook to invalidate all creator-related queries
export function useInvalidateCreators() {
  const queryClient = useQueryClient();
  const chainId = useChainId();

  return (creatorAddress?: string) => {
    if (creatorAddress) {
      queryClient.invalidateQueries({ queryKey: ['envio-creator', creatorAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-creator-stats', creatorAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-creator-pools', creatorAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-creator-earnings', creatorAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-creator-verification', creatorAddress] });
      queryClient.invalidateQueries({ queryKey: ['envio-creator-active-pools', creatorAddress, chainId] });
    }
    queryClient.invalidateQueries({ queryKey: ['envio-top-creators'] });
    queryClient.invalidateQueries({ queryKey: ['envio-is-creator'] });
  };
}