import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useCoinTossRead, useContractAddress } from './use-contract';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useDivviIntegration } from './use-divvi-integration';

/**
 * Interface for verification information
 */
export interface VerificationInfo {
  isVerified: boolean;
  bonusPools: number;
  verificationTimestamp: number;
  status: string;
}

/**
 * Hook to check if a user is verified
 */
export function useIsVerified(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  return useCoinTossRead('isCreatorVerified', [targetAddress], {
    enabled: !!targetAddress,
  }) as {
    data: boolean | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to get detailed verification information
 */
export function useVerificationInfo(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const result = useCoinTossRead('getVerificationInfo', [targetAddress], {
    enabled: !!targetAddress,
  });

  // Transform array response to VerificationInfo object
  const transformedResult = {
    ...result,
    data: result.data ? {
      isVerified: (result.data as any)[0] as boolean,
      bonusPools: Number((result.data as any)[1] as bigint),
      verificationTimestamp: Number((result.data as any)[2] as bigint),
      status: (result.data as any)[3] as string,
    } as VerificationInfo : undefined
  };

  return transformedResult as {
    data: VerificationInfo | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

/**
 * Hook to get verification status for multiple addresses
 */
export function useMultipleVerificationStatus(addresses: `0x${string}`[]) {
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  return useQuery({
    queryKey: ['multipleVerificationStatus', addresses],
    queryFn: async () => {
      if (!publicClient || !contractAddress || addresses.length === 0) {
        return [];
      }

      try {
        // Prepare batch contract calls
        const calls = addresses.map(address => ({
          address: contractAddress,
          abi: CONTRACT_CONFIG.abi,
          functionName: 'isCreatorVerified',
          args: [address]
        }));

        // Execute all calls in batch
        const results = await publicClient.multicall({ contracts: calls as any });

        return addresses.map((address, index) => ({
          address,
          isVerified: results[index]?.status === 'success' ? results[index].result as boolean : false
        }));
      } catch (error) {
        // Return all false for errors
        return addresses.map(address => ({ address, isVerified: false }));
      }
    },
    enabled: !!publicClient && !!contractAddress && addresses.length > 0,
    staleTime: isMainnet ? 30000 : 60000, // 30s on mainnet, 60s on testnet
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for submitting verification proof to contract
 */
export function useSubmitVerification() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const contractAddress = useContractAddress();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const chainId = useChainId();
  const { generateDivviTag, trackTransaction } = useDivviIntegration();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Track transaction when confirmed
  if (isConfirmed && hash) {
    trackTransaction(hash, chainId);
  }

  const submitVerification = useMutation({
    mutationFn: async (params: { proofPayload: string; userContextData: string }) => {
      if (!writeContract || !contractAddress) throw new Error('Contract not available');

      // Generate Divvi referral tag
      const divviTag = generateDivviTag();
      console.log('🛡️ Submitting verification with Divvi tracking:', { divviTag });

      return writeContract({
        address: contractAddress,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'verifySelfProof',
        args: [params.proofPayload as `0x${string}`, params.userContextData as `0x${string}`],
        dataSuffix: divviTag as `0x${string}`,
      });
    },
    onSuccess: () => {
      // Invalidate verification queries
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['isCreatorVerified', address] });
        queryClient.invalidateQueries({ queryKey: ['getVerificationInfo', address] });
        queryClient.invalidateQueries({ queryKey: ['getCreatorInfo', address] });
        queryClient.invalidateQueries({ queryKey: ['multipleVerificationStatus'] });
      }
    },
  });

  return {
    submitVerification: submitVerification.mutate,
    submitVerificationAsync: submitVerification.mutateAsync,
    isPending: isPending || submitVerification.isPending,
    isConfirming,
    isConfirmed,
    error: error || submitVerification.error,
    hash,
  };
}

/**
 * Hook to watch for verification events
 */
export function useWatchVerificationEvents() {
  // This could be implemented with useWatchContractEvent if needed
  // For now, we'll rely on query invalidation
  return {};
}

/**
 * Helper hook to format verification status
 */
export function useFormattedVerificationStatus(address?: `0x${string}`) {
  const { data: verificationInfo, isLoading, error } = useVerificationInfo(address);

  if (!verificationInfo) {
    return {
      isLoading,
      error,
      statusText: 'Not verified',
      statusColor: 'gray',
      bonusText: 'No bonus',
      verificationInfo: null,
    };
  }

  return {
    isLoading,
    error,
    statusText: verificationInfo.isVerified ? 'Verified' : 'Not verified',
    statusColor: verificationInfo.isVerified ? 'green' : 'gray',
    bonusText: verificationInfo.isVerified ? `+${verificationInfo.bonusPools} bonus pool${verificationInfo.bonusPools !== 1 ? 's' : ''}` : 'No bonus',
    verificationInfo,
  };
}