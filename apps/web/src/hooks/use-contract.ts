import { useReadContract, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';

/**
 * Hook to get the contract address for the current chain
 */
export function useContractAddress() {
  const chainId = useChainId();
  return CONTRACT_CONFIG.addresses[chainId as keyof typeof CONTRACT_CONFIG.addresses] as `0x${string}` | undefined;
}

/**
 * Hook for read operations from the contract
 */
export function useCoinTossRead(
  functionName: any,
  args?: readonly any[],
  options?: { enabled?: boolean }
) {
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive caching on mainnet
  const isMainnet = chainId === 42220; // Celo mainnet

  return useReadContract({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    functionName,
    args: args as any,
    query: {
      enabled: !!contractAddress && options?.enabled !== false,
      staleTime: isMainnet ? 45000 : 10000, // 45s on mainnet (9x block time), 10s on testnet
      gcTime: isMainnet ? 15 * 60 * 1000 : 5 * 60 * 1000, // 15min on mainnet, 5min on testnet
      refetchOnWindowFocus: true,
      refetchInterval: isMainnet ? 60000 : false, // Auto-refetch every 60s on mainnet (slower)
      retry: isMainnet ? 5 : 3, // More retries on mainnet
      retryDelay: attemptIndex => Math.min(3000 * 2 ** attemptIndex, 20000), // Longer exponential backoff
    },
  });
}