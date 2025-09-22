import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useContractAddress } from './use-contract';

/**
 * Hook to get all players who have joined a pool by watching PlayerJoined events
 */
export function useJoinedPlayers(poolId: number) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();

  const {
    data: joinedPlayers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['joinedPlayers', poolId],
    queryFn: async () => {
      if (!publicClient || !contractAddress || poolId <= 0) {
        return [];
      }

      try {
        // Get all PlayerJoined events for this pool
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
          args: { poolId: BigInt(poolId) },
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        // Extract unique player addresses
        const players = logs
          .map(log => log.args?.player)
          .filter((player): player is `0x${string}` => !!player)
          .filter((player, index, array) => array.indexOf(player) === index); // Remove duplicates

        return players;
      } catch (error) {
        console.error('Error fetching joined players:', error);
        return [];
      }
    },
    enabled: !!publicClient && !!contractAddress && poolId > 0,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    joinedPlayers,
    isLoading,
    error,
    count: joinedPlayers.length
  };
}