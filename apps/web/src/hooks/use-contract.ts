import { useContract, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';

/**
 * Hook to get the CoinToss contract instance
 */
export function useCoinTossContract() {
  const chainId = useChainId();
  
  return useContract({
    address: CONTRACT_CONFIG.addresses[chainId as keyof typeof CONTRACT_CONFIG.addresses] as `0x${string}`,
    abi: CONTRACT_CONFIG.abi,
  });
}

/**
 * Hook to get the contract address for the current chain
 */
export function useContractAddress() {
  const chainId = useChainId();
  return CONTRACT_CONFIG.addresses[chainId as keyof typeof CONTRACT_CONFIG.addresses] as `0x${string}` | undefined;
}

/**
 * Hook for write operations to the contract
 */
export function useCoinTossWrite() {
  const contractAddress = useContractAddress();
  
  return useWriteContract({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
  });
}

/**
 * Hook for read operations from the contract
 */
export function useCoinTossRead(
  functionName: string,
  args?: readonly unknown[],
  options?: { enabled?: boolean }
) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    functionName,
    args,
    query: {
      enabled: !!contractAddress && options?.enabled !== false,
    },
  });
}