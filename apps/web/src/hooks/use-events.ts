import { useEffect, useState } from 'react';
import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { CONTRACT_CONFIG } from '@/lib/contract';
import { useContractAddress } from './use-contract';

/**
 * Hook to watch for PoolCreated events
 */
export function useWatchPoolCreated(
  onEvent?: (poolId: bigint, creator: `0x${string}`, entryFee: bigint, maxPlayers: bigint) => void
) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'PoolCreated',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args && onEvent) {
          const { poolId, creator, entryFee, maxPlayers } = log.args;
          onEvent(poolId!, creator!, entryFee!, maxPlayers!);
        }
      });
    },
  });
}

/**
 * Hook to watch for PlayerJoined events
 */
export function useWatchPlayerJoined({
  poolId,
  onLogs
}: {
  poolId?: bigint | string | number;
  onLogs?: (logs: any[]) => void;
} = {}) {
  const contractAddress = useContractAddress();

  const poolIdBigInt = poolId ? (typeof poolId === 'bigint' ? poolId : BigInt(poolId)) : undefined;

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'PlayerJoined',
    args: poolIdBigInt ? { poolId: poolIdBigInt } : undefined,
    onLogs(logs) {
      if (onLogs) {
        onLogs(logs);
      }
    },
  });
}

/**
 * Hook to watch for PoolActivated events
 */
export function useWatchPoolActivated({
  poolId,
  onLogs
}: {
  poolId?: bigint | string | number;
  onLogs?: (logs: any[]) => void;
} = {}) {
  const contractAddress = useContractAddress();

  const poolIdBigInt = poolId ? (typeof poolId === 'bigint' ? poolId : BigInt(poolId)) : undefined;

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'PoolActivated',
    args: poolIdBigInt ? { poolId: poolIdBigInt } : undefined,
    onLogs(logs) {
      if (onLogs) {
        onLogs(logs);
      }
    },
  });
}

/**
 * Hook to watch for PlayerMadeChoice events
 */
export function useWatchPlayerMadeChoice({
  poolId,
  onLogs
}: {
  poolId?: bigint | string | number;
  onLogs?: (logs: any[]) => void;
} = {}) {
  const contractAddress = useContractAddress();

  const poolIdBigInt = poolId ? (typeof poolId === 'bigint' ? poolId : BigInt(poolId)) : undefined;

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'PlayerMadeChoice',
    args: poolIdBigInt ? { poolId: poolIdBigInt } : undefined,
    onLogs(logs) {
      if (onLogs) {
        onLogs(logs);
      }
    },
  });
}

/**
 * Hook to watch for RoundResolved events
 */
export function useWatchRoundResolved({
  poolId,
  onLogs
}: {
  poolId?: bigint | string | number;
  onLogs?: (logs: any[]) => void;
} = {}) {
  const contractAddress = useContractAddress();

  const poolIdBigInt = poolId ? (typeof poolId === 'bigint' ? poolId : BigInt(poolId)) : undefined;

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'RoundResolved',
    args: poolIdBigInt ? { poolId: poolIdBigInt } : undefined,
    onLogs(logs) {
      if (onLogs) {
        onLogs(logs);
      }
    },
  });
}

/**
 * Hook to watch for GameCompleted events
 */
export function useWatchGameCompleted({
  poolId,
  onLogs
}: {
  poolId?: bigint | string | number;
  onLogs?: (logs: any[]) => void;
} = {}) {
  const contractAddress = useContractAddress();

  const poolIdBigInt = poolId ? (typeof poolId === 'bigint' ? poolId : BigInt(poolId)) : undefined;

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'GameCompleted',
    args: poolIdBigInt ? { poolId: poolIdBigInt } : undefined,
    onLogs(logs) {
      if (onLogs) {
        onLogs(logs);
      }
    },
  });
}

/**
 * Hook to watch for StakeDeposited events
 */
export function useWatchStakeDeposited(
  onEvent?: (creator: `0x${string}`, amount: bigint, poolsEligible: bigint) => void
) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'StakeDeposited',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args && onEvent) {
          const { creator, amount, poolsEligible } = log.args;
          onEvent(creator!, amount!, poolsEligible!);
        }
      });
    },
  });
}

/**
 * Hook to watch for StakeWithdrawn events
 */
export function useWatchStakeWithdrawn(
  onEvent?: (creator: `0x${string}`, amount: bigint, penalty: bigint) => void
) {
  const contractAddress = useContractAddress();

  useWatchContractEvent({
    address: contractAddress,
    abi: CONTRACT_CONFIG.abi,
    eventName: 'StakeWithdrawn',
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args && onEvent) {
          const { creator, amount, penalty } = log.args;
          onEvent(creator!, amount!, penalty!);
        }
      });
    },
  });
}

/**
 * Hook to get historical events for a pool
 */
export function usePoolEvents(poolId: number, fromBlock?: bigint) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();

  useEffect(() => {
    if (!publicClient || !contractAddress || poolId <= 0) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          events: CONTRACT_CONFIG.abi.filter(item => item.type === 'event') as any,
          args: { poolId: BigInt(poolId) } as any,
          fromBlock: fromBlock || 'earliest',
          toBlock: 'latest',
        });

        const formattedEvents = logs.map((log) => ({
          ...log,
          timestamp: new Date().toISOString(), // You might want to get actual block timestamp
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching pool events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient, contractAddress, poolId, fromBlock]);

  return { events, isLoading, refetch: () => {} };
}

/**
 * Comprehensive hook for game events (combines multiple event watchers)
 */
export function useGameEventWatchers(poolId: number) {
  const [gameEvents, setGameEvents] = useState<{
    playerJoined: any[];
    poolActivated: any[];
    playerMadeChoice: any[];
    roundResolved: any[];
    gameCompleted: any[];
  }>({
    playerJoined: [],
    poolActivated: [],
    playerMadeChoice: [],
    roundResolved: [],
    gameCompleted: [],
  });

  // Watch for player joined events
  useWatchPlayerJoined({
    poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, player, currentPlayers, maxPlayers } = log.args;
          setGameEvents(prev => ({
            ...prev,
            playerJoined: [...prev.playerJoined, { poolId, player, currentPlayers, maxPlayers, timestamp: Date.now() }],
          }));
        }
      });
    }
  });

  // Watch for pool activated events
  useWatchPoolActivated({
    poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, totalPlayers, prizePool } = log.args;
          setGameEvents(prev => ({
            ...prev,
            poolActivated: [...prev.poolActivated, { poolId, totalPlayers, prizePool, timestamp: Date.now() }],
          }));
        }
      });
    }
  });

  // Watch for player choice events
  useWatchPlayerMadeChoice({
    poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, player, choice, round } = log.args;
          setGameEvents(prev => ({
            ...prev,
            playerMadeChoice: [...prev.playerMadeChoice, { poolId, player, choice, round, timestamp: Date.now() }],
          }));
        }
      });
    }
  });

  // Watch for round resolved events
  useWatchRoundResolved({
    poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, round, winningChoice, eliminatedCount, remainingCount } = log.args;
          setGameEvents(prev => ({
            ...prev,
            roundResolved: [...prev.roundResolved, {
              poolId, round, winningChoice, eliminatedCount, remainingCount, timestamp: Date.now()
            }],
          }));
        }
      });
    }
  });

  // Watch for game completed events
  useWatchGameCompleted({
    poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args) {
          const { poolId, winner, prizeAmount } = log.args;
          setGameEvents(prev => ({
            ...prev,
            gameCompleted: [...prev.gameCompleted, { poolId, winner, prizeAmount, timestamp: Date.now() }],
          }));
        }
      });
    }
  });

  return gameEvents;
}