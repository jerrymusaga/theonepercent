import { useEffect, useState } from 'react';
import { useWatchContractEvent, usePublicClient, useChainId } from 'wagmi';
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
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  useEffect(() => {
    if (!publicClient || !contractAddress || poolId <= 0) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use provided fromBlock, or limited range on mainnet, or earliest on testnet
        const effectiveFromBlock = fromBlock || (isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const);

        const logs = await Promise.race([
          publicClient.getLogs({
            address: contractAddress,
            events: CONTRACT_CONFIG.abi.filter(item => item.type === 'event') as any,
            args: { poolId: BigInt(poolId) } as any,
            fromBlock: effectiveFromBlock,
            toBlock: 'latest',
          }),
          // Timeout after 8 seconds to quickly fallback on mainnet
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
          )
        ]) as any[];

        const formattedEvents = logs.map((log) => ({
          ...log,
          timestamp: new Date().toISOString(), // You might want to get actual block timestamp
        }));

        setEvents(formattedEvents);
      } catch (error) {
        // Error handled silently - return empty events for timeout
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient, contractAddress, poolId, fromBlock, isMainnet]);

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

/**
 * Hook to get detailed game results and round history
 */
export function useGameResults(poolId: number) {
  const [gameResults, setGameResults] = useState<{
    rounds: any[];
    playerChoices: any[];
    winner: any;
    isLoading: boolean;
    error: Error | null;
  }>({
    rounds: [],
    playerChoices: [],
    winner: null,
    isLoading: true,
    error: null
  });

  const publicClient = usePublicClient();
  const contractAddress = useContractAddress();
  const chainId = useChainId();

  // Use more aggressive strategy on mainnet due to indexing delays
  const isMainnet = chainId === 42220; // Celo mainnet

  useEffect(() => {
    if (!publicClient || !contractAddress || poolId <= 0) return;

    const fetchGameResults = async () => {
      setGameResults(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Get current block for reasonable range calculation
        const currentBlock = await publicClient.getBlockNumber();

        // Use last 100k blocks for mainnet, earliest for testnet
        const fromBlock = isMainnet
          ? currentBlock - BigInt(100000)
          : 'earliest' as const;

        // Fetch all relevant events for this pool with timeout protection
        const eventFetches = [
          // Round resolved events
          Promise.race([
            publicClient.getLogs({
              address: contractAddress,
              event: {
                type: 'event',
                name: 'RoundResolved',
                inputs: [
                  { name: 'poolId', type: 'uint256', indexed: true },
                  { name: 'round', type: 'uint256', indexed: false },
                  { name: 'winningChoice', type: 'uint8', indexed: false },
                  { name: 'eliminatedCount', type: 'uint256', indexed: false },
                  { name: 'remainingCount', type: 'uint256', indexed: false }
                ]
              },
              args: { poolId: BigInt(poolId) },
              fromBlock,
              toBlock: 'latest'
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
            )
          ]) as Promise<any[]>,
          // Player choice events
          Promise.race([
            publicClient.getLogs({
              address: contractAddress,
              event: {
                type: 'event',
                name: 'PlayerMadeChoice',
                inputs: [
                  { name: 'poolId', type: 'uint256', indexed: true },
                  { name: 'player', type: 'address', indexed: true },
                  { name: 'choice', type: 'uint8', indexed: false },
                  { name: 'round', type: 'uint256', indexed: false }
                ]
              },
              args: { poolId: BigInt(poolId) },
              fromBlock,
              toBlock: 'latest'
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
            )
          ]) as Promise<any[]>,
          // Game completed events
          Promise.race([
            publicClient.getLogs({
              address: contractAddress,
              event: {
                type: 'event',
                name: 'GameCompleted',
                inputs: [
                  { name: 'poolId', type: 'uint256', indexed: true },
                  { name: 'winner', type: 'address', indexed: true },
                  { name: 'prizeAmount', type: 'uint256', indexed: false }
                ]
              },
              args: { poolId: BigInt(poolId) },
              fromBlock,
              toBlock: 'latest'
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Event fetch timeout')), isMainnet ? 8000 : 30000)
            )
          ]) as Promise<any[]>
        ];

        const [roundResolvedLogs, playerChoiceLogs, gameCompletedLogs] = await Promise.all(eventFetches);

        // Process round resolved events
        const rounds = roundResolvedLogs.map(log => ({
          round: Number(log.args.round),
          winningChoice: log.args.winningChoice,
          eliminatedCount: Number(log.args.eliminatedCount),
          remainingCount: Number(log.args.remainingCount),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        })).sort((a, b) => a.round - b.round);

        // Process player choice events
        const playerChoices = playerChoiceLogs.map(log => ({
          player: log.args.player,
          choice: Number(log.args.choice),
          round: Number(log.args.round),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        }));

        // Process winner
        const winner = gameCompletedLogs.length > 0 ? {
          address: gameCompletedLogs[0].args.winner,
          prizeAmount: gameCompletedLogs[0].args.prizeAmount,
          blockNumber: gameCompletedLogs[0].blockNumber,
          transactionHash: gameCompletedLogs[0].transactionHash
        } : null;

        setGameResults({
          rounds,
          playerChoices,
          winner,
          isLoading: false,
          error: null
        });

      } catch (error) {
        // For timeout errors, set empty results to allow UI to render
        setGameResults({
          rounds: [],
          playerChoices: [],
          winner: null,
          isLoading: false,
          error: error as Error
        });
      }
    };

    fetchGameResults();
  }, [publicClient, contractAddress, poolId, isMainnet]);

  return gameResults;
}

/**
 * Hook to get the latest round results for display
 */
export function useLatestRoundResult(poolId: number) {
  const gameResults = useGameResults(poolId);

  if (gameResults.isLoading || gameResults.rounds.length === 0) {
    return {
      isLoading: gameResults.isLoading,
      data: null,
      error: gameResults.error
    };
  }

  const latestRound = gameResults.rounds[gameResults.rounds.length - 1];
  const roundChoices = gameResults.playerChoices.filter(choice => choice.round === latestRound.round);

  // Group choices by selection
  const choiceDistribution = {
    HEADS: roundChoices.filter(c => c.choice === 1), // PlayerChoice.HEADS = 1
    TAILS: roundChoices.filter(c => c.choice === 2)  // PlayerChoice.TAILS = 2
  };

  return {
    isLoading: false,
    data: {
      round: latestRound.round,
      winningChoice: latestRound.winningChoice === 1 ? 'HEADS' : 'TAILS',
      eliminatedCount: latestRound.eliminatedCount,
      remainingCount: latestRound.remainingCount,
      choices: {
        HEADS: {
          count: choiceDistribution.HEADS.length,
          players: choiceDistribution.HEADS.map(c => ({
            address: c.player,
            choice: 'HEADS'
          }))
        },
        TAILS: {
          count: choiceDistribution.TAILS.length,
          players: choiceDistribution.TAILS.map(c => ({
            address: c.player,
            choice: 'TAILS'
          }))
        }
      }
    },
    error: null
  };
}