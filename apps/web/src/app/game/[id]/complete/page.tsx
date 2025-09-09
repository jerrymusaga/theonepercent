"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Trophy,
  Crown,
  Star,
  Coins,
  Users,
  TrendingUp,
  Share2,
  ArrowLeft,
  Download,
  Copy,
  CheckCircle2,
  Zap,
  Target,
  Clock,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock game completion data
const mockGameComplete = {
  gameId: 1,
  totalRounds: 3,
  totalDuration: "12m 45s",
  
  winner: {
    id: 4,
    name: "@player4",
    address: "0x4444...4444",
    avatar: "/api/placeholder/80/80",
    isCurrentUser: true,
    prize: "19.0", // 95% of prize pool
    winRate: "75%",
    gamesPlayed: 12,
    totalEarnings: "89.5"
  },
  
  gameStats: {
    totalPlayers: 8,
    prizePool: "20.0",
    entryFee: "2.5",
    creatorFee: "1.0", // 5% to creator
    rounds: [
      {
        round: 1,
        choices: { HEADS: 1, TAILS: 7 },
        winningChoice: "HEADS",
        eliminated: 7,
        survivors: 1
      },
      {
        round: 2,
        choices: { HEADS: 2, TAILS: 4 },
        winningChoice: "HEADS",
        eliminated: 4,
        survivors: 2
      },
      {
        round: 3,
        choices: { HEADS: 1, TAILS: 1 },
        winningChoice: "HEADS", // Random tie-breaker
        eliminated: 1,
        survivors: 1
      }
    ]
  },
  
  finalRankings: [
    { position: 1, name: "@player4", avatar: "/api/placeholder/48/48", choice: "HEADS", eliminatedRound: null, prize: "19.0", isCurrentUser: true },
    { position: 2, name: "@player3", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 3, prize: "0", isCurrentUser: false },
    { position: 3, name: "@player2", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 2, prize: "0", isCurrentUser: false },
    { position: 4, name: "@player5", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 2, prize: "0", isCurrentUser: false },
    { position: 5, name: "@player1", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 1, prize: "0", isCurrentUser: false },
    { position: 6, name: "@player6", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 1, prize: "0", isCurrentUser: false },
    { position: 7, name: "@player7", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 1, prize: "0", isCurrentUser: false },
    { position: 8, name: "@player8", avatar: "/api/placeholder/48/48", choice: "TAILS", eliminatedRound: 1, prize: "0", isCurrentUser: false }
  ],
  
  creator: {
    name: "@alice",
    avatar: "/api/placeholder/40/40",
    reward: "1.0"
  }
};

const ConfettiAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 50 }, (_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          {Math.random() > 0.5 ? "🎉" : "🎊"}
        </div>
      ))}
    </div>
  );
};

const WinnerCelebration = ({ winner, isCurrentUser }: { winner: any; isCurrentUser: boolean }) => {
  return (
    <Card className="p-8 text-center bg-gradient-to-br from-yellow-50 via-gold-50 to-orange-50 border-yellow-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 text-6xl">👑</div>
        <div className="absolute top-4 right-4 text-6xl">🏆</div>
        <div className="absolute bottom-4 left-4 text-6xl">⭐</div>
        <div className="absolute bottom-4 right-4 text-6xl">💎</div>
      </div>

      <div className="relative z-10">
        {/* Winner announcement */}
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className={`text-4xl font-bold mb-2 ${isCurrentUser ? 'text-green-600' : 'text-yellow-600'}`}>
            {isCurrentUser ? "CONGRATULATIONS!" : "GAME OVER"}
          </h1>
          <p className="text-xl text-gray-700">
            {isCurrentUser ? "You are the champion!" : `${winner.name} wins the game!`}
          </p>
        </div>

        {/* Winner profile */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative">
            <img 
              src={winner.avatar} 
              alt={winner.name}
              className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg"
            />
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900">{winner.name}</h2>
            <p className="text-sm text-gray-600 font-mono">{winner.address}</p>
            {isCurrentUser && (
              <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                That's you! 🎯
              </div>
            )}
          </div>
        </div>

        {/* Prize display */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="w-8 h-8 text-yellow-600" />
            <span className="text-3xl font-bold text-yellow-600">{winner.prize} CELO</span>
          </div>
          <p className="text-gray-600">Prize won from this game</p>
        </div>

        {/* Claim prize button (only for winner) */}
        {isCurrentUser && (
          <Button 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg px-8 py-4 mb-4"
            size="lg"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Claim Prize ({winner.prize} CELO)
          </Button>
        )}

        {/* Winner stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{winner.winRate}</p>
            <p className="text-sm text-gray-600">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{winner.gamesPlayed}</p>
            <p className="text-sm text-gray-600">Games Played</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{winner.totalEarnings} CELO</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const GameSummary = ({ gameStats }: { gameStats: any }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Game Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xl font-bold text-blue-600">{gameStats.totalPlayers}</p>
          <p className="text-xs text-blue-800">Total Players</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-xl font-bold text-purple-600">{gameStats.rounds.length}</p>
          <p className="text-xs text-purple-800">Rounds Played</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-xl font-bold text-yellow-600">{gameStats.prizePool} CELO</p>
          <p className="text-xs text-yellow-800">Prize Pool</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xl font-bold text-green-600">{mockGameComplete.totalDuration}</p>
          <p className="text-xs text-green-800">Game Duration</p>
        </div>
      </div>

      {/* Round by round breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Round Breakdown:</h4>
        {gameStats.rounds.map((round: any) => (
          <div key={round.round} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {round.round}
              </div>
              <div>
                <p className="text-sm font-medium">
                  H: {round.choices.HEADS} vs T: {round.choices.TAILS}
                </p>
                <p className="text-xs text-gray-600">
                  {round.winningChoice} won • {round.eliminated} eliminated
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{round.survivors} left</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const FinalRankings = ({ rankings }: { rankings: any[] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-600" />
        Final Rankings
      </h3>
      
      <div className="space-y-3">
        {rankings.map((player) => (
          <div 
            key={player.position}
            className={`
              flex items-center gap-4 p-3 rounded-lg transition-colors
              ${player.position === 1 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                player.position <= 3 ? 'bg-gray-50 border border-gray-200' :
                'bg-white border border-gray-100'
              }
              ${player.isCurrentUser ? 'ring-2 ring-blue-400' : ''}
            `}
          >
            {/* Position */}
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${player.position === 1 ? 'bg-yellow-500 text-white' :
                player.position === 2 ? 'bg-gray-400 text-white' :
                player.position === 3 ? 'bg-orange-600 text-white' :
                'bg-gray-200 text-gray-600'
              }
            `}>
              {player.position === 1 ? '👑' : 
               player.position === 2 ? '🥈' :
               player.position === 3 ? '🥉' :
               player.position}
            </div>

            {/* Player info */}
            <div className="flex items-center gap-3 flex-1">
              <img 
                src={player.avatar} 
                alt={player.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{player.name}</p>
                  {player.isCurrentUser && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">YOU</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {player.eliminatedRound ? `Eliminated Round ${player.eliminatedRound}` : 'Winner'}
                </p>
              </div>
            </div>

            {/* Prize */}
            <div className="text-right">
              {player.position === 1 ? (
                <p className="font-bold text-green-600">{player.prize} CELO</p>
              ) : (
                <p className="text-gray-400 text-sm">No prize</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default function GameCompletePage() {
  const params = useParams();
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const gameId = params?.id;
  const gameData = mockGameComplete;
  const isWinner = gameData.winner.isCurrentUser;

  // Hide confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    const message = isWinner 
      ? `🎉 I just won ${gameData.winner.prize} CELO playing theonepercent! Join the next game and see if you can outsmart the crowd!`
      : `Just watched an epic game on theonepercent! ${gameData.winner.name} won ${gameData.winner.prize} CELO by choosing the minority. Can you beat them?`;
    
    const url = `${window.location.origin}/pools`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'theonepercent - Minority Wins!',
          text: message,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${message} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
      {showConfetti && <ConfettiAnimation />}
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pools')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Winner celebration */}
        <div className="mb-8">
          <WinnerCelebration 
            winner={gameData.winner} 
            isCurrentUser={isWinner}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Game summary */}
          <GameSummary gameStats={gameData.gameStats} />
          
          {/* Creator reward */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              Creator Reward
            </h3>
            
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={gameData.creator.avatar} 
                alt="Creator"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{gameData.creator.name}</p>
                <p className="text-sm text-gray-600">Pool Creator</p>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-purple-800">Creator Fee (5%)</span>
                <span className="font-bold text-purple-600">{gameData.creator.reward} CELO</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Final rankings */}
        <div className="mb-8">
          <FinalRankings rankings={gameData.finalRankings} />
        </div>

        {/* Action buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/pools')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Target className="w-5 h-5 mr-2" />
              Play Another Game
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </div>

          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {isWinner 
              ? "Congratulations on your victory! Ready for another challenge?"
              : "Better luck next time! Study the psychology and try again."
            }
          </p>
        </div>
      </div>
    </div>
  );
}