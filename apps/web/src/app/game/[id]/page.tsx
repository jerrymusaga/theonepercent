"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import {
  ArrowLeft,
  Users,
  Coins,
  Trophy,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Timer,
  Crown,
  Zap,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  usePoolInfo,
  useGameProgress,
  usePlayerGameState,
  useMakeSelection,
  usePlayerChoice,
  useHasPlayerChosen,
  useIsPlayerEliminated,
  useRemainingPlayers,
  useWatchPlayerMadeChoice,
  useWatchRoundResolved,
  useWatchGameCompleted
} from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { PlayerChoice, PoolStatus } from "@/lib/contract";

// Loading component
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div className={`animate-spin rounded-full border-b-2 border-current ${className}`}></div>
);

// Error component
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Card className="p-4 bg-red-50 border-red-200">
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <div className="flex-1">
        <p className="font-medium text-red-800">Error</p>
        <p className="text-sm text-red-700">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  </Card>
);

// Access control components
const WalletConnectionRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
    <Card className="p-8 text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
      <p className="text-gray-600 mb-6">
        You need to connect your wallet to participate in the game.
      </p>
      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const GameNotFound = ({ poolId }: { poolId: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
    <Card className="p-8 text-center max-w-md mx-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h2>
      <p className="text-gray-600 mb-6">
        Pool #{poolId} doesn't exist or hasn't been activated yet.
      </p>
      <Button
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
        onClick={() => window.location.href = '/pools'}
      >
        Browse Pools
      </Button>
    </Card>
  </div>
);

// Helper functions
const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const getChoiceLabel = (choice: PlayerChoice) => {
  switch (choice) {
    case PlayerChoice.HEADS:
      return "HEADS";
    case PlayerChoice.TAILS:
      return "TAILS";
    default:
      return "None";
  }
};

const getChoiceColor = (choice: PlayerChoice) => {
  switch (choice) {
    case PlayerChoice.HEADS:
      return "bg-gradient-to-br from-yellow-400 to-orange-500";
    case PlayerChoice.TAILS:
      return "bg-gradient-to-br from-gray-400 to-gray-600";
    default:
      return "bg-gray-300";
  }
};

const CoinChoiceButton = ({
  choice,
  selected,
  onClick,
  disabled
}: {
  choice: PlayerChoice;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) => {
  const isHeads = choice === PlayerChoice.HEADS;
  const choiceLabel = getChoiceLabel(choice);

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative h-32 w-32 rounded-full p-0 transition-all duration-300 transform
        ${selected
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-lg'
          : 'bg-white border-4 border-gray-200 hover:border-blue-300 text-gray-700 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex flex-col items-center justify-center">
        <div className={`
          w-16 h-16 rounded-full mb-2 flex items-center justify-center
          ${getChoiceColor(choice)}
        `}>
          <span className="text-2xl font-bold text-white">
            {isHeads ? "H" : "T"}
          </span>
        </div>
        <span className="font-bold text-sm">{choiceLabel}</span>
      </div>

      {selected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      )}
    </Button>
  );
};

interface PlayerCardProps {
  address: `0x${string}`;
  isEliminated: boolean;
  hasChosen: boolean;
  choice?: PlayerChoice;
  isCurrentUser: boolean;
  poolId: bigint;
}

const PlayerCard = ({ address, isEliminated, hasChosen, choice, isCurrentUser, poolId }: PlayerCardProps) => {
  const getStatusColor = () => {
    if (isEliminated) return "bg-red-100 border-red-200 text-red-800";
    if (hasChosen) return "bg-green-100 border-green-200 text-green-800";
    if (isCurrentUser) return "bg-blue-100 border-blue-400 text-blue-800";
    return "bg-yellow-100 border-yellow-200 text-yellow-800";
  };

  const getStatusText = () => {
    if (isEliminated) return "Eliminated";
    if (hasChosen) return "Ready ✓";
    if (isCurrentUser) return "Your turn";
    return "Choosing...";
  };

  // Generate avatar from address
  const generateAvatar = (addr: string) => {
    const colors = [
      'from-red-400 to-red-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-yellow-400 to-yellow-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600'
    ];
    const colorIndex = parseInt(addr.slice(-1), 16) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-300
      ${getStatusColor()}
      ${isCurrentUser ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      ${isEliminated ? 'opacity-60' : ''}
    `}>
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <div className={`
            w-12 h-12 rounded-full bg-gradient-to-br ${generateAvatar(address)}
            flex items-center justify-center text-white font-bold text-lg
            ${isEliminated ? 'grayscale' : ''}
          `}>
            {address.slice(2, 4).toUpperCase()}
          </div>
          {hasChosen && !isEliminated && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-medium text-sm">{formatAddress(address)}</p>
          <p className="text-xs opacity-80">{getStatusText()}</p>
        </div>
      </div>

      {/* Choice indicator (only shown for eliminated players or after round resolves) */}
      {choice && choice !== PlayerChoice.NONE && isEliminated && (
        <div className="text-xs text-center mt-2 opacity-75">
          Chose: {getChoiceLabel(choice)}
        </div>
      )}

      {/* Waiting indicator for active players who haven't chosen */}
      {!isEliminated && !hasChosen && !isCurrentUser && (
        <div className="flex justify-center mt-2">
          <div className="animate-pulse flex space-x-1">
            <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animation-delay-100"></div>
            <div className="w-1.5 h-1.5 bg-current rounded-full animation-delay-200"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function GameArenaPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedChoice, setSelectedChoice] = useState<PlayerChoice | null>(null);

  const poolId = params?.id as string;

  // Wallet and contract hooks
  const { address, isConnected, isConnecting } = useAccount();

  const {
    data: poolInfo,
    isLoading: isLoadingPool,
    error: poolError,
    refetch: refetchPool
  } = usePoolInfo(poolId ? parseInt(poolId) : 0);

  const {
    data: gameProgress,
    isLoading: isLoadingProgress,
    refetch: refetchProgress
  } = useGameProgress(poolId ? parseInt(poolId) : 0);

  const {
    data: remainingPlayers,
    isLoading: isLoadingPlayers,
    refetch: refetchPlayers
  } = useRemainingPlayers(poolId ? parseInt(poolId) : 0);

  const {
    data: hasPlayerChosen,
    isLoading: isLoadingHasChosen,
    error: hasChosenError
  } = useHasPlayerChosen(poolId ? parseInt(poolId) : 0, address);

  const {
    data: playerChoice,
    isLoading: isLoadingPlayerChoice,
    error: playerChoiceError
  } = usePlayerChoice(poolId ? parseInt(poolId) : 0, address);

  const {
    data: isPlayerEliminated,
    isLoading: isLoadingEliminated,
    error: eliminatedError
  } = useIsPlayerEliminated(poolId ? parseInt(poolId) : 0, address);

  const {
    makeSelection,
    isPending: isSubmitting,
    isConfirming,
    isConfirmed,
    error: selectionError,
    hash
  } = useMakeSelection();

  const { success, error } = useToast();

  // Real-time event watching
  useWatchPlayerMadeChoice({
    poolId: poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args && log.args.poolId.toString() === poolId) {
          success("Choice made!", `A player made their choice for round ${log.args.round}`);
          refetchProgress();
          refetchPlayers();
        }
      });
    }
  });

  useWatchRoundResolved({
    poolId: poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args && log.args.poolId.toString() === poolId) {
          const winningChoice = getChoiceLabel(log.args.winningChoice);
          success("Round resolved!", `${winningChoice} won! ${log.args.eliminatedCount} players eliminated.`);
          refetchProgress();
          refetchPlayers();
          setSelectedChoice(null); // Reset choice for next round
        }
      });
    }
  });

  useWatchGameCompleted({
    poolId: poolId,
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args && log.args.poolId.toString() === poolId) {
          success("Game completed!", `Winner: ${formatAddress(log.args.winner)}`);
          setTimeout(() => {
            router.push(`/game/${poolId}/results`);
          }, 3000);
        }
      });
    }
  });

  // Handle successful choice submission
  useEffect(() => {
    if (isConfirmed && hash) {
      success("Choice submitted!", "Your selection has been recorded on the blockchain.");
      refetchProgress();
    }
  }, [isConfirmed, hash, success, refetchProgress]);

  // Handle selection errors
  useEffect(() => {
    if (selectionError) {
      error("Selection failed", selectionError.message || "Failed to submit choice. Please try again.");
    }
  }, [selectionError, error]);

  // Access control
  if (!isConnected && !isConnecting) {
    return <WalletConnectionRequired />;
  }

  // Loading state
  if (isConnecting || isLoadingPool || isLoadingProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading game data...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (poolError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-4">
          <ErrorBanner
            message={poolError.message || "Failed to load game data"}
            onRetry={refetchPool}
          />
        </div>
      </div>
    );
  }

  // Game not found or not active
  if (!poolInfo || poolInfo.status !== PoolStatus.ACTIVE) {
    return <GameNotFound poolId={poolId} />;
  }

  const handleChoiceSelect = (choice: PlayerChoice) => {
    if (hasPlayerChosen || isPlayerEliminated) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = () => {
    if (!selectedChoice || !address || !poolId) return;

    try {
      makeSelection({ poolId: parseInt(poolId), choice: selectedChoice });
    } catch (err) {
      console.error("Selection error:", err);
    }
  };

  const prizePoolFormatted = formatEther(poolInfo.prizePool);
  const currentRound = gameProgress?.currentRound || BigInt(0);
  const totalPlayers = gameProgress?.totalPlayersCount || BigInt(0);
  const remainingPlayersCount = gameProgress?.remainingPlayersCount || BigInt(0);
  const isGameComplete = gameProgress?.isGameComplete || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Arena #{poolId}</h1>
              <p className="text-gray-600">
                Round {currentRound.toString()} • {remainingPlayersCount.toString()} players remaining
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Prize Pool</p>
            <p className="text-xl font-bold text-yellow-600">{parseFloat(prizePoolFormatted).toFixed(2)} CELO</p>
          </div>
        </div>

        {/* Game Status Bar */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs opacity-80">Round</p>
                <p className="text-xl font-bold">{currentRound.toString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80">Remaining</p>
                <p className="text-xl font-bold">{remainingPlayersCount.toString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80">Total</p>
                <p className="text-xl font-bold">{totalPlayers.toString()}</p>
              </div>
              {remainingPlayers && (
                <div className="text-center">
                  <p className="text-xs opacity-80">Chosen</p>
                  <p className="text-xl font-bold">
                    {remainingPlayers.filter(player => {
                      // For now we'll show a loading state since we'd need individual calls for each player
                      return false; // TODO: Track individual player choices
                    }).length}/{remainingPlayers.length}
                  </p>
                </div>
              )}
            </div>

            {isGameComplete && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white font-bold">
                  <Trophy className="w-5 h-5" />
                  Game Complete!
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {/* Choice Selection */}
            <Card className="p-8 mb-6 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Make Your Choice</h2>
                <p className="text-gray-600">
                  Choose HEADS or TAILS. Remember: <strong>minority wins!</strong>
                </p>
              </div>

              <div className="flex justify-center gap-8 mb-6">
                <CoinChoiceButton
                  choice={PlayerChoice.HEADS}
                  selected={selectedChoice === PlayerChoice.HEADS}
                  onClick={() => handleChoiceSelect(PlayerChoice.HEADS)}
                  disabled={hasPlayerChosen || isPlayerEliminated || isSubmitting || isConfirming}
                />

                <CoinChoiceButton
                  choice={PlayerChoice.TAILS}
                  selected={selectedChoice === PlayerChoice.TAILS}
                  onClick={() => handleChoiceSelect(PlayerChoice.TAILS)}
                  disabled={hasPlayerChosen || isPlayerEliminated || isSubmitting || isConfirming}
                />
              </div>

              {/* Submit Button */}
              {!isPlayerEliminated && !hasPlayerChosen && (
                <div className="space-y-3">
                  {/* Selection Error */}
                  {selectionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        {selectionError.message || "Failed to submit choice. Please try again."}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitChoice}
                    disabled={!selectedChoice || isSubmitting || isConfirming}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-3 text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Sending Transaction...
                      </>
                    ) : isConfirming ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Confirming on Blockchain...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Lock in Choice
                      </>
                    )}
                  </Button>

                  {selectedChoice && !isSubmitting && !isConfirming && (
                    <p className="text-sm text-gray-600">
                      You selected: <strong>{getChoiceLabel(selectedChoice)}</strong>
                    </p>
                  )}

                  {/* Transaction hash display */}
                  {hash && isConfirming && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 mb-1">Transaction submitted:</p>
                      <p className="text-xs font-mono text-blue-700 break-all">
                        {hash.slice(0, 10)}...{hash.slice(-8)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Waiting for confirmation...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Already chosen message */}
              {hasPlayerChosen && !isPlayerEliminated && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">
                    Choice submitted! Your selection: <strong>{getChoiceLabel(playerChoice || PlayerChoice.NONE)}</strong>
                  </span>
                </div>
              )}

              {/* Eliminated Message */}
              {isPlayerEliminated && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">You have been eliminated from this game</span>
                </div>
              )}
            </Card>

            {/* Strategy Tip */}
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CircleDot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">Strategy Tip</h3>
                  <p className="text-sm text-purple-800">
                    Think about what others might choose. If most players pick the same option, 
                    you want to be in the <strong>minority</strong> to survive. Psychology is key!
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Players Panel */}
          <div className="space-y-6">
            {/* Active Players */}
            {!isLoadingPlayers && remainingPlayers && remainingPlayers.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Remaining Players ({remainingPlayers.length})
                </h3>
                <div className="space-y-3">
                  {remainingPlayers.map((playerAddress: `0x${string}`) => (
                    <PlayerCard
                      key={playerAddress}
                      address={playerAddress}
                      isEliminated={false}
                      hasChosen={false} // TODO: We'd need individual calls to check this
                      isCurrentUser={address === playerAddress}
                      poolId={BigInt(poolId)}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Loading Players */}
            {isLoadingPlayers && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Loading Players...
                </h3>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="p-4 bg-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Game Progress Info */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                Game Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Round:</span>
                  <span className="font-bold">{currentRound.toString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Players Remaining:</span>
                  <span className="font-bold">{remainingPlayersCount.toString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Started:</span>
                  <span className="font-bold">{totalPlayers.toString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Elimination Rate:</span>
                  <span className="font-bold">
                    {totalPlayers > BigInt(0)
                      ? ((Number(totalPlayers - remainingPlayersCount) / Number(totalPlayers)) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>

              {isGameComplete && (
                <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                  <p className="text-green-800 font-medium">🎉 Game Complete!</p>
                  <p className="text-green-700 text-sm mt-1">Check results for winner details</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}