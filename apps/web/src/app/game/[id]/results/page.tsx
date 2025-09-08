"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Trophy,
  TrendingDown,
  Users,
  Zap,
  Crown,
  Timer,
  BarChart3,
  ArrowRight,
  Skull,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock round results data
const mockRoundResults = {
  gameId: 1,
  round: 2,
  totalRounds: null, // Game continues until 1 winner
  
  choices: {
    HEADS: {
      count: 1,
      players: [
        { 
          id: 4,
          name: "@player4", 
          avatar: "/api/placeholder/48/48",
          isCurrentUser: false
        }
      ]
    },
    TAILS: {
      count: 2,
      players: [
        { 
          id: 3,
          name: "@player3", 
          avatar: "/api/placeholder/48/48",
          isCurrentUser: true
        },
        { 
          id: 5,
          name: "@player5", 
          avatar: "/api/placeholder/48/48",
          isCurrentUser: false
        }
      ]
    }
  },
  
  winningChoice: "HEADS", // Minority wins
  eliminatedPlayers: [
    { 
      id: 3,
      name: "@player3", 
      avatar: "/api/placeholder/48/48",
      choice: "TAILS",
      isCurrentUser: true,
      finalPosition: 2 // 2nd place
    },
    { 
      id: 5,
      name: "@player5", 
      avatar: "/api/placeholder/48/48",
      choice: "TAILS",
      isCurrentUser: false,
      finalPosition: 3 // 3rd place
    }
  ],
  
  survivors: [
    { 
      id: 4,
      name: "@player4", 
      avatar: "/api/placeholder/48/48",
      choice: "HEADS",
      isCurrentUser: false
    }
  ],
  
  gameStats: {
    prizePool: "20.0",
    remainingPlayers: 1,
    totalPlayers: 8,
    isGameComplete: true, // Only 1 player left
    winner: {
      id: 4,
      name: "@player4", 
      avatar: "/api/placeholder/48/48",
      prize: "19.0" // 95% of prize pool
    }
  },
  
  previousRounds: [
    {
      round: 1,
      choices: { HEADS: 1, TAILS: 4 },
      winningChoice: "HEADS",
      eliminated: 4,
      survivors: 3
    }
  ]
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
        ${player.isCurrentUser ? 'ring-2 ring-blue-400' : ''}
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
            <img 
              src={player.avatar} 
              alt={player.name}
              className={`w-16 h-16 rounded-full ${isEliminated ? 'grayscale' : ''}`}
            />
            
            {isWinner && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce">
                <Crown className="w-4 h-4 text-white" />
              </div>
            )}
            
            {player.isCurrentUser && (
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{player.name}</h3>
              {player.isCurrentUser && (
                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">YOU</span>
              )}
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
              
              {isEliminated && player.finalPosition && (
                <div className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                  {player.finalPosition === 1 ? "1st" : 
                   player.finalPosition === 2 ? "2nd" :
                   player.finalPosition === 3 ? "3rd" :
                   `${player.finalPosition}th`} Place
                </div>
              )}
            </div>

            <p className={`
              text-sm font-medium
              ${isWinner ? 'text-green-700' : isEliminated ? 'text-red-700' : 'text-blue-700'}
            `}>
              {isWinner ? "🎉 WINNER!" : isEliminated ? "💀 Eliminated" : "🎯 Survived"}
              {isWinner && player.prize && ` • Won ${player.prize} CELO`}
            </p>
          </div>
        </div>
      </Card>
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
  const [showContinueButton, setShowContinueButton] = useState(false);
  
  const gameId = params?.id;
  const results = mockRoundResults;

  // Show continue button after animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContinueButton(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (results.gameStats.isGameComplete) {
      // Go to game completion page
      router.push(`/game/${gameId}/complete`);
    } else {
      // Go to next round
      router.push(`/game/${gameId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Round {results.round} Results</h1>
          <p className="text-gray-600">
            {results.gameStats.isGameComplete ? "Game Complete!" : `${results.gameStats.remainingPlayers} player${results.gameStats.remainingPlayers !== 1 ? 's' : ''} remaining`}
          </p>
        </div>

        {/* Coin Flip Animation */}
        <div className="text-center mb-8">
          <CoinFlipAnimation result={results.winningChoice} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Choice Distribution */}
          <div className="lg:col-span-1">
            <ChoiceDistributionChart 
              choices={results.choices} 
              winningChoice={results.winningChoice} 
            />
          </div>

          {/* Game Stats */}
          <div className="lg:col-span-2">
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
                  <p className="text-2xl font-bold text-blue-600">{results.gameStats.remainingPlayers}</p>
                  <p className="text-sm text-blue-800">Players Left</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{results.eliminatedPlayers.length}</p>
                  <p className="text-sm text-red-800">Eliminated</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{results.round}</p>
                  <p className="text-sm text-green-800">Current Round</p>
                </div>
              </div>

              {results.gameStats.isGameComplete && results.gameStats.winner && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                  <div className="flex items-center gap-3">
                    <img 
                      src={results.gameStats.winner.avatar} 
                      alt="Winner"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-bold text-green-900 text-lg">
                        🏆 {results.gameStats.winner.name} Wins!
                      </p>
                      <p className="text-green-700">
                        Won {results.gameStats.winner.prize} CELO
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Player Results */}
        <div className="space-y-6 mb-8">
          {/* Survivors */}
          {results.survivors.length > 0 && !results.gameStats.isGameComplete && (
            <div>
              <h2 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Survivors ({results.survivors.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.survivors.map((player, index) => (
                  <PlayerResultCard 
                    key={player.id}
                    player={player}
                    isWinner={false}
                    isEliminated={false}
                    showDelay={3000 + (index * 200)}
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
                  player={results.gameStats.winner}
                  isWinner={true}
                  isEliminated={false}
                  showDelay={3000}
                />
              </div>
            </div>
          )}

          {/* Eliminated Players */}
          {results.eliminatedPlayers.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Eliminated This Round ({results.eliminatedPlayers.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.eliminatedPlayers.map((player, index) => (
                  <PlayerResultCard 
                    key={player.id}
                    player={player}
                    isWinner={false}
                    isEliminated={true}
                    showDelay={3500 + (index * 200)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {showContinueButton && (
          <div className="text-center">
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 text-lg"
              size="lg"
            >
              {results.gameStats.isGameComplete ? (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  View Final Results
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Continue to Round {results.round + 1}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}