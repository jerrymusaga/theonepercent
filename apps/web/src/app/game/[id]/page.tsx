"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  ArrowLeft,
  Users,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  Wallet,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useMakeSelection,
  useWatchPlayerMadeChoice,
  useWatchRoundResolved,
  useWatchGameCompleted
} from "@/hooks";
import {
  useEnvioPoolInfo,
  useEnvioGameProgress,
  useEnvioPlayerChoice,
  useEnvioHasPlayerChosen,
  useEnvioIsPlayerEliminated,
  useEnvioRemainingPlayersForPool,
  useEnvioLatestGameRound,
} from "@/hooks/use-envio-players";
import { useToast } from "@/hooks/use-toast";
import { PlayerChoice, PoolStatus } from "@/lib/contract";

// Loading component
const LoadingSpinner = ({ className = "" }: { className?: string }) => (
  <div className={`animate-spin rounded-full border-b-2 border-current ${className}`}></div>
);

// Error component with gaming style
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="border-l-4 border-l-red-500 bg-gray-900/80 border border-red-500/30 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <div className="flex-1">
        <p className="font-semibold text-red-300 text-sm uppercase tracking-wide">
          SYSTEM ERROR
        </p>
        <p className="text-red-100 text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:border-red-400"
        >
          RETRY
        </Button>
      )}
    </div>
  </div>
);

// Tie notification component with gaming style
const TieNotification = ({ roundNumber, playerCount }: { roundNumber: number; playerCount: number }) => (
  <div className="border-l-4 border-l-yellow-500 bg-gray-900/80 border border-yellow-500/30 p-4 backdrop-blur-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/20 rounded-full">
        <CircleDot className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-yellow-300 text-sm uppercase tracking-wide">Round Tied!</p>
        <p className="text-yellow-100 text-sm">
          All {playerCount} players chose the same option in Round {roundNumber}. The round will be replayed.
        </p>
      </div>
      <div className="flex items-center gap-2 text-yellow-400">
        <Zap className="w-4 h-4" />
        <span className="text-xs font-medium">REPLAY</span>
      </div>
    </div>
  </div>
);

// Access control components with gaming style
const WalletConnectionRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
    {/* Background Effects */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
    </div>
    <Card className="relative z-10 p-8 text-center max-w-md mx-4 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
      <p className="text-gray-300 mb-6">
        You need to connect your wallet to participate in the game.
      </p>
      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
        Connect Wallet
      </Button>
    </Card>
  </div>
);

const GameNotFound = ({ poolId, onBrowsePools }: { poolId: string, onBrowsePools: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
    {/* Background Effects */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
    </div>
    <Card className="relative z-10 p-8 text-center max-w-md mx-4 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
      <p className="text-gray-300 mb-6">
        Pool #{poolId} doesn't exist or hasn't been activated yet.
      </p>
      <Button
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        onClick={onBrowsePools}
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
  isCurrentUser: boolean;
  poolId: number;
}


const PlayerCard = ({ address, isEliminated, isCurrentUser, poolId }: PlayerCardProps) => {
  const { data: hasChosen } = useEnvioHasPlayerChosen(poolId.toString(), address);
  const { data: choice } = useEnvioPlayerChoice(poolId.toString(), address);
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
      {choice && isEliminated && (
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
  } = useEnvioPoolInfo(poolId);

  const {
    data: gameProgress,
    isLoading: isLoadingProgress,
    refetch: refetchProgress
  } = useEnvioGameProgress(poolId);

  const {
    data: remainingPlayersData,
    isLoading: isLoadingPlayers,
    refetch: refetchPlayers
  } = useEnvioRemainingPlayersForPool(poolId);

  const {
    data: hasPlayerChosen
  } = useEnvioHasPlayerChosen(poolId, address);

  const {
    data: playerChoice
  } = useEnvioPlayerChoice(poolId, address);

  const {
    data: isPlayerEliminated
  } = useEnvioIsPlayerEliminated(poolId, address);

  // Tie scenario detection hooks
  const {
    data: latestGameRound
  } = useEnvioLatestGameRound(poolId);

  // Extract player addresses from Envio data to match existing format
  const remainingPlayers = remainingPlayersData?.map((player: any) => player.player_id) || [];

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        <Card className="relative z-10 p-8 text-center bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <LoadingSpinner className="w-12 h-12 mx-auto mb-4 text-white" />
          <p className="text-gray-300">Loading game data...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (poolError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-md mx-4">
          <ErrorBanner
            message={poolError.message || "Failed to load game data"}
            onRetry={refetchPool}
          />
        </div>
      </div>
    );
  }

  // Game not found
  if (!poolInfo) {
    return <GameNotFound poolId={poolId} onBrowsePools={() => router.push('/pools')} />;
  }

  // Helper function to map Envio string status to PoolStatus enum
  const mapEnvioStatusToPoolStatus = (envioStatus: string): PoolStatus => {
    switch (envioStatus) {
      case "WAITING_FOR_PLAYERS":
        return PoolStatus.OPENED;
      case "ACTIVE":
        return PoolStatus.ACTIVE;
      case "COMPLETED":
        return PoolStatus.COMPLETED;
      case "ABANDONED":
        return PoolStatus.ABANDONED;
      default:
        return PoolStatus.OPENED;
    }
  };

  // Map Envio pool status to enum
  const poolStatus = poolInfo ? mapEnvioStatusToPoolStatus(poolInfo.status) : PoolStatus.OPENED;

  // Check if pool is accessible
  const isAccessible = poolStatus === PoolStatus.ACTIVE ||
                      poolStatus === PoolStatus.COMPLETED ||
                      poolStatus === PoolStatus.OPENED ||
                      poolStatus === PoolStatus.ABANDONED;

  if (!isAccessible) {
    return <GameNotFound poolId={poolId} onBrowsePools={() => router.push('/pools')} />;
  }

  // Check if current user is actually part of the game
  const isPlayerInGame = address && remainingPlayers?.includes(address);

  const handleChoiceSelect = (choice: PlayerChoice) => {
    if (hasPlayerChosen || isPlayerEliminated || !isPlayerInGame) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = () => {
    if (!selectedChoice || !address || !poolId || !isPlayerInGame) return;

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
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
              <h1 className="text-2xl font-bold text-white">Game Arena #{poolId}</h1>
              <p className="text-gray-300">
                Round {currentRound.toString()} • {remainingPlayersCount.toString()} players remaining
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Prize Pool</p>
            <p className="text-xl font-bold text-yellow-400">{parseFloat(prizePoolFormatted).toFixed(2)} CELO</p>
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

        {/* Tie Notification - Show when current round has a tie */}
        {latestGameRound?.isTie && (
          <div className="mb-6">
            <TieNotification
              roundNumber={latestGameRound.roundNumber}
              playerCount={latestGameRound.remainingPlayers}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {/* Status-based content */}
            {poolStatus === PoolStatus.ACTIVE && (
              <Card className="p-8 mb-6 text-center bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isPlayerInGame ? "Make Your Choice" : "Watch the Game"}
                  </h2>
                  <p className="text-gray-300">
                    {isPlayerInGame
                      ? "Choose HEADS or TAILS. Remember: minority wins!"
                      : "Watch as players make their choices. You can only participate if you joined this pool."
                    }
                  </p>
                </div>

                <div className="flex justify-center gap-8 mb-6">
                  <CoinChoiceButton
                    choice={PlayerChoice.HEADS}
                    selected={selectedChoice === PlayerChoice.HEADS}
                    onClick={() => handleChoiceSelect(PlayerChoice.HEADS)}
                    disabled={hasPlayerChosen || isPlayerEliminated || !isPlayerInGame || isSubmitting || isConfirming}
                  />

                  <CoinChoiceButton
                    choice={PlayerChoice.TAILS}
                    selected={selectedChoice === PlayerChoice.TAILS}
                    onClick={() => handleChoiceSelect(PlayerChoice.TAILS)}
                    disabled={hasPlayerChosen || isPlayerEliminated || !isPlayerInGame || isSubmitting || isConfirming}
                  />
                </div>

                {/* Submit Button - Only for players in the game */}
                {!isPlayerEliminated && !hasPlayerChosen && isPlayerInGame && (
                  <div className="space-y-3">
                    {/* Selection Error */}
                    {selectionError && (
                      <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-300">
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
                      <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                        <p className="text-xs text-blue-300 mb-1">Transaction submitted:</p>
                        <p className="text-xs font-mono text-blue-200 break-all">
                          {hash.slice(0, 10)}...{hash.slice(-8)}
                        </p>
                        <p className="text-xs text-blue-300 mt-1">Waiting for confirmation...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Already chosen message */}
                {hasPlayerChosen && !isPlayerEliminated && isPlayerInGame && (
                  <div className="flex items-center justify-center gap-2 text-green-400 bg-green-900/30 border border-green-500/50 p-4 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">
                      Choice submitted! Your selection: <strong>{getChoiceLabel(playerChoice || PlayerChoice.NONE)}</strong>
                    </span>
                  </div>
                )}

                {/* Eliminated Message */}
                {isPlayerEliminated && (
                  <div className="flex items-center justify-center gap-2 text-red-400 bg-red-900/30 border border-red-500/50 p-4 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">You have been eliminated from this game</span>
                  </div>
                )}

                {/* Not in game message - for users who haven't joined this pool */}
                {!isPlayerInGame && !isPlayerEliminated && address && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-gray-400 bg-gray-900/30 border border-gray-600/50 p-4 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">You are not part of this game - you can only watch</span>
                    </div>
                    <div className="text-center">
                      <Button
                        onClick={() => router.push('/pools')}
                        variant="outline"
                        className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Join Other Pools
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Completed Pool */}
            {poolStatus === PoolStatus.COMPLETED && (
              <Card className="p-8 mb-6 text-center bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Game Completed! 🎉</h2>
                  <p className="text-gray-300">
                    This game has finished. Check the results below.
                  </p>
                </div>

                {remainingPlayers && remainingPlayers.length === 1 && (
                  <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                    <p className="text-green-400 font-medium mb-2">🏆 Winner:</p>
                    <p className="text-green-300 font-mono">
                      {formatAddress(remainingPlayers[0])}
                    </p>
                    {address === remainingPlayers[0] && (
                      <p className="text-green-400 font-bold mt-2">That's you! Congratulations! 🎉</p>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => router.push(`/game/${poolId}/results`)}
                  className="mt-6 bg-green-600 hover:bg-green-700"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Detailed Results
                </Button>
              </Card>
            )}

            {/* Opened Pool */}
            {poolStatus === PoolStatus.OPENED && (
              <Card className="p-8 mb-6 text-center bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Waiting for Players</h2>
                  <p className="text-gray-300">
                    This pool is open and waiting for more players to join before the game can start.
                  </p>
                </div>

                <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg mb-6">
                  <p className="text-blue-300 mb-2">
                    <strong>{Number(poolInfo.currentPlayers)}/{Number(poolInfo.maxPlayers)}</strong> players joined
                  </p>
                  <div className="w-full bg-blue-900/50 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Number(poolInfo.currentPlayers) / Number(poolInfo.maxPlayers)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/pools')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Back to Pools
                </Button>
              </Card>
            )}

            {/* Abandoned Pool */}
            {poolStatus === PoolStatus.ABANDONED && (
              <Card className="p-8 mb-6 text-center bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Pool Abandoned</h2>
                  <p className="text-gray-300">
                    This pool was abandoned and all players have been automatically refunded.
                  </p>
                </div>

                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-300">
                    The pool creator unstaked before the game could complete.
                    All entry fees have been returned to players.
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/pools')}
                  variant="outline"
                  className="mt-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pools
                </Button>
              </Card>
            )}

            {/* Strategy Tip */}
            <Card className="p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CircleDot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-300 mb-2">Strategy Tip</h3>
                  <p className="text-sm text-purple-200">
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
              <Card className="p-6 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-green-400" />
                  Remaining Players ({remainingPlayers.length})
                </h3>
                <div className="space-y-3">
                  {remainingPlayers.map((playerAddress: `0x${string}`) => (
                    <PlayerCard
                      key={playerAddress}
                      address={playerAddress}
                      isEliminated={false}
                      isCurrentUser={address === playerAddress}
                      poolId={parseInt(poolId)}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Loading Players */}
            {isLoadingPlayers && (
              <Card className="p-6 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-green-400" />
                  Loading Players...
                </h3>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}