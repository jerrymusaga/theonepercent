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

  return useReadContract({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    functionName,
    args: args as any,
    query: {
      enabled: !!contractAddress && options?.enabled !== false,
    },
  });
}