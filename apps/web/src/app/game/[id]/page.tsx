"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Coins, 
  Clock, 
  Trophy, 
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Timer,
  Crown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock game data - will be replaced with real contract data
const mockGameData = {
  id: 1,
  status: "ACTIVE",
  currentRound: 2,
  maxRounds: null, // Until 1 player remains
  prizePool: "20.0",
  entryFee: "2.5",
  creator: "@alice",
  timeRemaining: 45, // seconds
  roundTimeLimit: 60, // seconds per round
  
  players: [
    { 
      id: 1,
      address: "0x1111...1111", 
      name: "@player1", 
      avatar: "/api/placeholder/48/48", 
      isEliminated: true,
      choice: "TAILS",
      isReady: true,
      eliminatedInRound: 1
    },
    { 
      id: 2,
      address: "0x2222...2222", 
      name: "@player2", 
      avatar: "/api/placeholder/48/48", 
      isEliminated: true,
      choice: "TAILS",
      isReady: true,
      eliminatedInRound: 1
    },
    { 
      id: 3,
      address: "0x3333...3333", 
      name: "@player3", 
      avatar: "/api/placeholder/48/48", 
      isEliminated: false,
      choice: null,
      isReady: false,
      isCurrentUser: true
    },
    { 
      id: 4,
      address: "0x4444...4444", 
      name: "@player4", 
      avatar: "/api/placeholder/48/48", 
      isEliminated: false,
      choice: "HEADS",
      isReady: true
    },
    { 
      id: 5,
      address: "0x5555...5555", 
      name: "@player5", 
      avatar: "/api/placeholder/48/48", 
      isEliminated: false,
      choice: null,
      isReady: false
    }
  ],
  
  roundHistory: [
    {
      round: 1,
      choices: { HEADS: 1, TAILS: 4 },
      winningChoice: "HEADS",
      eliminatedPlayers: ["@player1", "@player2", "@player6", "@player7"],
      remainingPlayers: 3
    }
  ],
  
  gameStats: {
    totalPlayers: 8,
    remainingPlayers: 3,
    eliminatedPlayers: 5
  }
};

const CoinChoiceButton = ({ 
  choice, 
  selected, 
  onClick, 
  disabled 
}: { 
  choice: "HEADS" | "TAILS";
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}) => {
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
          ${choice === "HEADS" 
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
            : 'bg-gradient-to-br from-gray-400 to-gray-600'
          }
        `}>
          <span className="text-2xl font-bold text-white">
            {choice === "HEADS" ? "H" : "T"}
          </span>
        </div>
        <span className="font-bold text-sm">{choice}</span>
      </div>
      
      {selected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
      )}
    </Button>
  );
};

const PlayerCard = ({ player, currentUser }: { player: typeof mockGameData.players[0]; currentUser: boolean }) => {
  const getStatusColor = () => {
    if (player.isEliminated) return "bg-red-100 border-red-200 text-red-800";
    if (player.isReady) return "bg-green-100 border-green-200 text-green-800";
    if (currentUser) return "bg-blue-100 border-blue-400 text-blue-800";
    return "bg-yellow-100 border-yellow-200 text-yellow-800";
  };

  const getStatusText = () => {
    if (player.isEliminated) return `Eliminated R${player.eliminatedInRound}`;
    if (player.isReady) return "Ready ✓";
    if (currentUser) return "Your turn";
    return "Choosing...";
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-300
      ${getStatusColor()}
      ${currentUser ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      ${player.isEliminated ? 'opacity-60' : ''}
    `}>
      {currentUser && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <img 
            src={player.avatar} 
            alt={player.name}
            className={`w-12 h-12 rounded-full ${player.isEliminated ? 'grayscale' : ''}`}
          />
          {player.isReady && !player.isEliminated && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">{player.name}</p>
          <p className="text-xs opacity-80">{getStatusText()}</p>
        </div>
      </div>
      
      {/* Choice indicator (only shown after round ends or for eliminated players) */}
      {player.choice && player.isEliminated && (
        <div className="text-xs text-center mt-2 opacity-75">
          Chose: {player.choice}
        </div>
      )}
      
      {/* Waiting indicator for active players who haven't chosen */}
      {!player.isEliminated && !player.isReady && !currentUser && (
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

const RoundTimer = ({ timeRemaining, totalTime }: { timeRemaining: number; totalTime: number }) => {
  const percentage = (timeRemaining / totalTime) * 100;
  const isUrgent = timeRemaining <= 15;
  
  return (
    <div className="text-center">
      <div className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg
        ${isUrgent 
          ? 'bg-red-100 text-red-800 animate-pulse' 
          : 'bg-blue-100 text-blue-800'
        }
      `}>
        <Timer className="w-5 h-5" />
        {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
        {String(timeRemaining % 60).padStart(2, '0')}
      </div>
      
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 mx-auto">
        <div 
          className={`
            h-2 rounded-full transition-all duration-1000
            ${isUrgent 
              ? 'bg-gradient-to-r from-red-500 to-orange-500' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function GameArenaPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedChoice, setSelectedChoice] = useState<"HEADS" | "TAILS" | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(mockGameData.timeRemaining);

  const gameId = params?.id;
  const game = mockGameData;
  const currentUser = game.players.find(p => p.isCurrentUser);
  const activePlayers = game.players.filter(p => !p.isEliminated);
  const playersReady = activePlayers.filter(p => p.isReady).length;

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit or handle timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChoiceSelect = (choice: "HEADS" | "TAILS") => {
    if (hasSubmitted) return;
    setSelectedChoice(choice);
  };

  const handleSubmitChoice = async () => {
    if (!selectedChoice || hasSubmitted) return;
    
    setHasSubmitted(true);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real app, this would update the game state
    console.log(`Submitted choice: ${selectedChoice}`);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Game Arena #{gameId}</h1>
              <p className="text-gray-600">Round {game.currentRound} • {activePlayers.length} players remaining</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Prize Pool</p>
            <p className="text-xl font-bold text-yellow-600">{game.prizePool} CELO</p>
          </div>
        </div>

        {/* Game Status Bar */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs opacity-80">Round</p>
                <p className="text-xl font-bold">{game.currentRound}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80">Players</p>
                <p className="text-xl font-bold">{activePlayers.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs opacity-80">Ready</p>
                <p className="text-xl font-bold">{playersReady}/{activePlayers.length}</p>
              </div>
            </div>
            
            <RoundTimer timeRemaining={timeRemaining} totalTime={game.roundTimeLimit} />
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
                  choice="HEADS"
                  selected={selectedChoice === "HEADS"}
                  onClick={() => handleChoiceSelect("HEADS")}
                  disabled={hasSubmitted || !currentUser || currentUser?.isEliminated}
                />
                
                <CoinChoiceButton
                  choice="TAILS"
                  selected={selectedChoice === "TAILS"}
                  onClick={() => handleChoiceSelect("TAILS")}
                  disabled={hasSubmitted || !currentUser || currentUser?.isEliminated}
                />
              </div>
              
              {/* Submit Button */}
              {currentUser && !currentUser.isEliminated && (
                <div className="space-y-3">
                  <Button
                    onClick={handleSubmitChoice}
                    disabled={!selectedChoice || hasSubmitted}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-3 text-lg"
                  >
                    {hasSubmitted ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Lock in Choice
                      </>
                    )}
                  </Button>
                  
                  {selectedChoice && !hasSubmitted && (
                    <p className="text-sm text-gray-600">
                      You selected: <strong>{selectedChoice}</strong>
                    </p>
                  )}
                  
                  {hasSubmitted && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Choice submitted! Waiting for other players...</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Eliminated Message */}
              {currentUser?.isEliminated && (
                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">You were eliminated in Round {currentUser.eliminatedInRound}</span>
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
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Active Players ({activePlayers.length})
              </h3>
              <div className="space-y-3">
                {activePlayers.map((player) => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    currentUser={player.isCurrentUser || false}
                  />
                ))}
              </div>
            </Card>

            {/* Eliminated Players */}
            {game.players.some(p => p.isEliminated) && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Eliminated ({game.players.filter(p => p.isEliminated).length})
                </h3>
                <div className="space-y-2">
                  {game.players
                    .filter(p => p.isEliminated)
                    .map((player) => (
                      <PlayerCard 
                        key={player.id} 
                        player={player} 
                        currentUser={false}
                      />
                    ))}
                </div>
              </Card>
            )}

            {/* Round History */}
            {game.roundHistory.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Round History
                </h3>
                <div className="space-y-3">
                  {game.roundHistory.map((round) => (
                    <div key={round.round} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Round {round.round}</span>
                        <span className="text-sm text-green-600 font-medium">
                          {round.winningChoice} Won
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>HEADS: {round.choices.HEADS} • TAILS: {round.choices.TAILS}</p>
                        <p>{round.eliminatedPlayers.length} players eliminated</p>
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