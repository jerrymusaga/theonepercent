"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEther } from "viem";
import {
  ArrowLeft,
  Trophy,
  Crown,
  BarChart3,
  ArrowRight,
  TrendingDown,
  Zap,
  Skull,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useEnvioPoolInfo,
  useEnvioGameProgress,
  useEnvioRemainingPlayersForPool,
  useEnvioGameResults,
  useEnvioLatestRoundResult,
} from "@/hooks/use-envio-players";
import { PoolStatus } from "@/lib/contract";


const PlayerResultCard = ({
  player,
  isWinner,
  isEliminated,
  showDelay = 0
}: {
  player: any;
  isWinner: boolean;
  isEliminated: boolean;
  showDelay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [showDelay]);

  return (
    <div className={`
      transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
    `}>
      <Card className={`
        p-4 relative overflow-hidden
        ${isWinner ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' :
          isEliminated ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-300' :
          'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300'
        }
      `}>
        {/* Background decoration */}
        <div className={`
          absolute top-0 right-0 opacity-10
          ${isWinner ? 'text-green-500' : isEliminated ? 'text-red-500' : 'text-blue-500'}
        `}>
          {isWinner ? <Crown className="w-16 h-16" /> : isEliminated ? <Skull className="w-16 h-16" /> : <Star className="w-16 h-16" />}
        </div>

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg ${isEliminated ? 'grayscale' : ''}`}>
              {player.address ? `${player.address.slice(0, 2)}${player.address.slice(-2)}` : '??'}
            </div>

            {isWinner && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">
                {player.address ? `${player.address.slice(0, 6)}...${player.address.slice(-4)}` : 'Unknown'}
              </h3>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${player.choice === "HEADS"
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 text-gray-800'
                }
              `}>
                Chose: {player.choice}
              </div>
            </div>

            <p className={`
              text-sm font-medium
              ${isWinner ? 'text-green-700' : isEliminated ? 'text-red-700' : 'text-blue-700'}
            `}>
              {isWinner ? "🎉 WINNER!" : isEliminated ? "💀 Eliminated" : "🎯 Survived"}
              {isWinner && player.prizeAmount && ` • Won ${formatEther(player.prizeAmount)} CELO`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CoinFlipAnimation = ({ result, delay = 0 }: { result: "HEADS" | "TAILS"; delay?: number }) => {
  const [isFlipping, setIsFlipping] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsFlipping(false);
    }, 2000 + delay);

    const timer2 = setTimeout(() => {
      setShowResult(true);
    }, 2500 + delay);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [delay]);

  return (
    <div className="flex flex-col items-center">
      <div className={`
        w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4
        transition-all duration-500 ${isFlipping ? 'animate-spin' : ''}
        ${result === "HEADS" 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
          : 'bg-gradient-to-br from-gray-400 to-gray-600'
        }
      `}>
        {showResult ? (result === "HEADS" ? "H" : "T") : "?"}
      </div>
      
      {showResult && (
        <div className={`
          text-2xl font-bold animate-pulse
          ${result === "HEADS" ? 'text-yellow-600' : 'text-gray-600'}
        `}>
          {result}
        </div>
      )}
    </div>
  );
};


const ChoiceDistributionChart = ({ choices, winningChoice }: { choices: any; winningChoice: string }) => {
  const total = choices.HEADS.count + choices.TAILS.count;
  const headsPercentage = (choices.HEADS.count / total) * 100;
  const tailsPercentage = (choices.TAILS.count / total) * 100;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Choice Distribution
      </h3>
      
      <div className="space-y-4">
        {/* HEADS */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-medium ${winningChoice === "HEADS" ? 'text-green-600' : 'text-gray-600'}`}>
              HEADS {winningChoice === "HEADS" ? "👑" : ""}
            </span>
            <span className="font-bold">{choices.HEADS.count} player{choices.HEADS.count !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                winningChoice === "HEADS" 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500'
              }`}
              style={{ width: `${headsPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{headsPercentage.toFixed(1)}%</p>
        </div>

        {/* TAILS */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className={`font-medium ${winningChoice === "TAILS" ? 'text-green-600' : 'text-gray-600'}`}>
              TAILS {winningChoice === "TAILS" ? "👑" : ""}
            </span>
            <span className="font-bold">{choices.TAILS.count} player{choices.TAILS.count !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                winningChoice === "TAILS" 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-gray-400 to-gray-600'
              }`}
              style={{ width: `${tailsPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{tailsPercentage.toFixed(1)}%</p>
        </div>

        {/* Winner explanation */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <strong>{winningChoice}</strong> was the minority choice and wins! 
            {choices[winningChoice].count} player{choices[winningChoice].count !== 1 ? 's' : ''} survive{choices[winningChoice].count === 1 ? 's' : ''}.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default function RoundResultsPage() {
  const params = useParams();
  const router = useRouter();

  const poolId = params?.id as string;

  // Get pool and game data from Envio
  const { data: poolInfo, isLoading: isLoadingPool } = useEnvioPoolInfo(poolId);
  const { data: gameProgress, isLoading: isLoadingGame } = useEnvioGameProgress(poolId);
  const { data: remainingPlayersData } = useEnvioRemainingPlayersForPool(poolId);
  const gameResults = useEnvioGameResults(poolId);
  const latestRoundResult = useEnvioLatestRoundResult(poolId);

  // Extract player addresses and current round from Envio data
  const remainingPlayers = remainingPlayersData?.map((player: any) => player.player_id) || [];
  const currentRound = gameProgress?.currentRound;

  const isLoading = isLoadingPool || isLoadingGame || gameResults.isLoading;

  // Early return if no pool data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game results...</p>
        </div>
      </div>
    );
  }

  if (!poolInfo || !gameProgress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h1>
          <p className="text-gray-600 mb-4">The game results could not be loaded.</p>
          <Button onClick={() => router.push('/pools')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>
        </div>
      </div>
    );
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

  // Transform Envio data to match UI expectations
  const poolStatus = poolInfo ? mapEnvioStatusToPoolStatus(poolInfo.status) : PoolStatus.OPENED;

  // For prize pool: use winner's prize amount if game is completed and pool shows 0 (claimed)
  const actualPrizePool = poolStatus === PoolStatus.COMPLETED && poolInfo.prizePool === BigInt(0) && gameResults.data?.winner
    ? gameResults.data.winner.prizeAmount
    : poolInfo.prizePool;

  const results = {
    round: Number(currentRound || 0),
    gameStats: {
      prizePool: formatEther(actualPrizePool || 0n),
      remainingPlayers: remainingPlayers.length,
      totalPlayers: gameProgress?.totalPlayersCount ? Number(gameProgress.totalPlayersCount) : Number(poolInfo?.currentPlayers || 0),
      isGameComplete: poolStatus === PoolStatus.COMPLETED,
      winner: gameResults.data?.winner
    },
    winningChoice: latestRoundResult.data?.data?.winningChoice || "HEADS",
    choices: latestRoundResult.data?.data?.choices || {
      HEADS: { count: 0, players: [] },
      TAILS: { count: 0, players: [] }
    },
    rounds: gameResults.data?.rounds || [],
    hasRoundData: (gameResults.data?.rounds || []).length > 0
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {results.gameStats.isGameComplete ? "Final Results" : `Round ${results.round} Results`}
          </h1>
          <p className="text-gray-600">
            {results.gameStats.isGameComplete ? "Game Complete!" : `${results.gameStats.remainingPlayers} player${results.gameStats.remainingPlayers !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {/* Coin Flip Animation */}
        {!results.gameStats.isGameComplete && results.hasRoundData && (
          <div className="text-center mb-8">
            <CoinFlipAnimation result={results.winningChoice as "HEADS" | "TAILS"} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Choice Distribution */}
          {!results.gameStats.isGameComplete && results.hasRoundData && (
            <div className="lg:col-span-1">
              <ChoiceDistributionChart
                choices={results.choices}
                winningChoice={results.winningChoice}
              />
            </div>
          )}

          {/* Game Stats */}
          <div className={results.gameStats.isGameComplete ? "lg:col-span-3" : "lg:col-span-2"}>
            <Card className="p-6 h-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Game Status
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{results.gameStats.prizePool} CELO</p>
                  <p className="text-sm text-yellow-800">Prize Pool</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{results.gameStats.totalPlayers}</p>
                  <p className="text-sm text-blue-800">Total Players</p>
                </div>

                {!results.gameStats.isGameComplete && (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{results.gameStats.remainingPlayers}</p>
                      <p className="text-sm text-green-800">Players Left</p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{results.round}</p>
                      <p className="text-sm text-purple-800">Current Round</p>
                    </div>
                  </>
                )}

                {results.gameStats.isGameComplete && (
                  <>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">1</p>
                      <p className="text-sm text-green-800">Winner</p>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{Math.max(0, results.gameStats.totalPlayers - 1)}</p>
                      <p className="text-sm text-red-800">Eliminated</p>
                    </div>
                  </>
                )}
              </div>

              {results.gameStats.isGameComplete && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-lg">
                        🏆 Winner!
                      </p>
                      <p className="text-green-700">
                        Won {results.gameStats.prizePool} CELO
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Game Summary for Completed Games */}
        {results.gameStats.isGameComplete && (
          <div className="mb-8">
            <Card className="p-6 text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center justify-center gap-2">
                <Crown className="w-6 h-6" />
                Game Complete!
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                The elimination game has ended. The prize pool of <span className="font-bold text-yellow-600">{results.gameStats.prizePool} CELO</span> has been awarded to the winner.
              </p>
              <div className="text-sm text-gray-600">
                <p>Final Round: {results.round}</p>
                <p>Total Players: {results.gameStats.totalPlayers}</p>
              </div>

              {results.gameStats.winner && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-lg">
                        🏆 Winner: {results.gameStats.winner.address.slice(0, 6)}...{results.gameStats.winner.address.slice(-4)}
                      </p>
                      <p className="text-green-700">
                        Won {formatEther(results.gameStats.winner.prizeAmount)} CELO
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Round Summary for Active Games */}
        {!results.gameStats.isGameComplete && results.hasRoundData && (
          <div className="mb-8">
            <Card className="p-6 text-center">
              <h2 className="text-xl font-bold text-purple-600 mb-4">
                Round {results.round} Summary
              </h2>
              <p className="text-gray-700">
                The minority choice <span className="font-bold text-green-600">{results.winningChoice}</span> wins!
                {results.gameStats.remainingPlayers} player{results.gameStats.remainingPlayers !== 1 ? 's' : ''} survive{results.gameStats.remainingPlayers === 1 ? 's' : ''} to the next round.
              </p>
            </Card>
          </div>
        )}

        {/* Player Results - Show detailed breakdown when we have round data */}
        {results.hasRoundData && (
          <div className="space-y-6 mb-8">
            {/* Survivors */}
            {!results.gameStats.isGameComplete && (results.choices as any)[results.winningChoice]?.players.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Survivors ({(results.choices as any)[results.winningChoice].players.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(results.choices as any)[results.winningChoice].players.map((player: any, index: number) => (
                    <PlayerResultCard
                      key={player.address}
                      player={player}
                      isWinner={false}
                      isEliminated={false}
                      showDelay={1000 + (index * 200)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Winner (if game complete) */}
            {results.gameStats.isGameComplete && results.gameStats.winner && (
              <div>
                <h2 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Champion
                </h2>
                <div className="max-w-md mx-auto">
                  <PlayerResultCard
                    player={{
                      address: results.gameStats.winner.address,
                      choice: results.winningChoice,
                      prizeAmount: results.gameStats.winner.prizeAmount
                    }}
                    isWinner={true}
                    isEliminated={false}
                    showDelay={1000}
                  />
                </div>
              </div>
            )}

            {/* Eliminated Players */}
            {(results.choices as any)[results.winningChoice === 'HEADS' ? 'TAILS' : 'HEADS']?.players.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Eliminated This Round ({(results.choices as any)[results.winningChoice === 'HEADS' ? 'TAILS' : 'HEADS'].players.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(results.choices as any)[results.winningChoice === 'HEADS' ? 'TAILS' : 'HEADS'].players.map((player: any, index: number) => (
                    <PlayerResultCard
                      key={player.address}
                      player={player}
                      isWinner={false}
                      isEliminated={true}
                      showDelay={1500 + (index * 200)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => router.push('/pools')}
            variant="outline"
            className="px-6 py-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pools
          </Button>

          {!results.gameStats.isGameComplete && (
            <Button
              onClick={() => router.push(`/game/${poolId}`)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue Game
            </Button>
          )}

          {results.gameStats.isGameComplete && (
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-3"
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}