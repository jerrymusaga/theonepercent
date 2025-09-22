import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useContractAddress } from './use-contract';

/**
 * Hook to get all players who have joined a pool by watching PlayerJoined events
 */
export function useJoinedPlayers(poolId: number) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive refresh strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

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
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 100k blocks for mainnet (about 1-2 weeks), earliest for testnet
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
            args: { poolId: BigInt(poolId) },
            fromBlock,
            toBlock: 'latest',
          }),
          // Timeout after 8 seconds to quickly fallback on mainnet
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
          )
        ]) as any[];

        const playersFromEvents = logs
          .map(log => log.args?.player)
          .filter((player): player is `0x${string}` => !!player)
          .filter((player, index, array) => array.indexOf(player) === index);

        // If events work, return them
        if (playersFromEvents.length > 0) {
          return playersFromEvents;
        }

        // Get current remaining players (this works reliably)
        const remainingPlayers = await publicClient.readContract({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'getRemainingPlayers',
          args: [BigInt(poolId)]
        }) as `0x${string}`[];

        return remainingPlayers || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!publicClient && !!contractAddress && poolId > 0,
    staleTime: isMainnet ? 10000 : 30000, // 10s on mainnet, 30s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isMainnet ? 15000 : false, // Auto-refetch every 15s on mainnet
    refetchOnWindowFocus: true, // Always refetch when window gains focus
  });

  return {
    joinedPlayers,
    isLoading,
    error,
    count: joinedPlayers.length
  };
}