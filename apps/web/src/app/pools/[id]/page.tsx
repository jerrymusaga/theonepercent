"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  Coins, 
  Clock, 
  Trophy, 
  AlertCircle, 
  Play,
  Eye,
  Share2,
  Copy,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock data for demonstration - will be replaced with real contract data
const mockPoolData = {
  id: 1,
  creator: "0x1234567890abcdef1234567890abcdef12345678",
  creatorName: "@alice",
  creatorAvatar: "/api/placeholder/40/40",
  creatorStats: {
    poolsCreated: 15,
    totalEarnings: "127.5",
    winRate: "68%"
  },
  entryFee: "2.5",
  maxPlayers: 8,
  currentPlayers: 6,
  prizePool: "20.0",
  status: "OPENED",
  createdAt: "2024-03-15T10:30:00Z",
  timeLeft: "5m 30s",
  autoCloseAt: "2024-03-15T11:00:00Z",
  players: [
    { address: "0x1111...1111", name: "@player1", avatar: "/api/placeholder/32/32", joinedAt: "5m ago" },
    { address: "0x2222...2222", name: "@player2", avatar: "/api/placeholder/32/32", joinedAt: "4m ago" },
    { address: "0x3333...3333", name: "@player3", avatar: "/api/placeholder/32/32", joinedAt: "3m ago" },
    { address: "0x4444...4444", name: "@player4", avatar: "/api/placeholder/32/32", joinedAt: "2m ago" },
    { address: "0x5555...5555", name: "@player5", avatar: "/api/placeholder/32/32", joinedAt: "1m ago" },
    { address: "0x6666...6666", name: "@player6", avatar: "/api/placeholder/32/32", joinedAt: "30s ago" }
  ],
  gameRules: {
    description: "A minority-wins elimination game where players choose HEADS or TAILS each round. The minority choice wins and majority players are eliminated.",
    rounds: "Multiple rounds until 1 winner remains",
    winCondition: "Be the last player standing",
    prizes: {
      winner: "95%",
      creator: "5%"
    }
  },
  history: {
    similarPools: 23,
    averageGameTime: "8m 32s",
    averageRounds: 3.2
  }
};

const JoinPoolModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  if (!isOpen) return null;

  const handleJoin = async () => {
    setIsConfirming(true);
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConfirming(false);
    onClose();
    // Redirect to game room after joining
    window.location.href = `/game/${mockPoolData.id}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Join Pool #{mockPoolData.id}</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Entry Fee</span>
            <span className="font-bold">{mockPoolData.entryFee} CELO</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Potential Prize</span>
            <span className="font-bold text-green-600">
              {((parseFloat(mockPoolData.prizePool) + parseFloat(mockPoolData.entryFee)) * 0.95).toFixed(2)} CELO
            </span>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Game Rules:</p>
                <ul className="text-xs space-y-1">
                  <li>• Choose HEADS or TAILS each round</li>
                  <li>• Minority choice wins, majority eliminated</li>
                  <li>• Last player standing wins the prize</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isConfirming}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </>
            ) : (
              "Join Pool"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState("5m 30s");
  const [copied, setCopied] = useState(false);

  const poolId = params?.id;
  const pool = mockPoolData; // In real app, fetch based on poolId

  useEffect(() => {
    // Simulate countdown timer
    const interval = setInterval(() => {
      // This would be calculated from actual blockchain data
      const now = new Date().getTime();
      const closeTime = new Date(pool.autoCloseAt).getTime();
      const diff = closeTime - now;
      
      if (diff > 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("Closed");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pool.autoCloseAt]);

  const handleShare = async () => {
    const url = `${window.location.origin}/pools/${poolId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Pool #${poolId} - theonepercent`,
          text: `Join this CoinToss game pool! Entry fee: ${pool.entryFee} CELO, Prize pool: ${pool.prizePool} CELO`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canJoin = pool.status === "OPENED" && pool.currentPlayers < pool.maxPlayers;
  const canActivate = pool.currentPlayers >= Math.ceil(pool.maxPlayers / 2);
  const fillPercentage = (pool.currentPlayers / pool.maxPlayers) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Pool #{poolId}</h1>
          <p className="text-gray-600">Minority-wins elimination game</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pool Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  pool.status === "OPENED" ? "bg-blue-500" : 
                  pool.status === "ACTIVE" ? "bg-green-500 animate-pulse" : 
                  "bg-gray-400"
                }`}></div>
                <span className="font-medium capitalize">{pool.status.toLowerCase()}</span>
              </div>
              
              {pool.status === "OPENED" && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{timeLeft}</span>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Players: {pool.currentPlayers}/{pool.maxPlayers}
                </span>
                <span className="text-sm text-gray-500">{fillPercentage.toFixed(0)}% full</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    canActivate 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                ></div>
              </div>
              
              {canActivate && pool.status === "OPENED" && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Can be activated (50%+ filled)
                </p>
              )}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Prize Pool</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900">{pool.prizePool} CELO</p>
                <p className="text-xs text-yellow-700">Winner gets 95%</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Entry Fee</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{pool.entryFee} CELO</p>
                <p className="text-xs text-blue-700">Per player</p>
              </div>
            </div>
          </Card>

          {/* Game Rules */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">How to Play</h3>
            <div className="space-y-4">
              <p className="text-gray-700">{pool.gameRules.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Rounds</h4>
                  <p className="text-sm text-purple-700">{pool.gameRules.rounds}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Win Condition</h4>
                  <p className="text-sm text-green-700">{pool.gameRules.winCondition}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Prize Split</h4>
                  <p className="text-sm text-blue-700">Winner: {pool.gameRules.prizes.winner}, Creator: {pool.gameRules.prizes.creator}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Pool History */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Pool Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pool.history.similarPools}</p>
                <p className="text-sm text-gray-500">Similar pools created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pool.history.averageGameTime}</p>
                <p className="text-sm text-gray-500">Average game time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pool.history.averageRounds}</p>
                <p className="text-sm text-gray-500">Average rounds</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Pool Creator</h3>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={pool.creatorAvatar} 
                alt="Creator" 
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium">{pool.creatorName}</p>
                <p className="text-xs text-gray-500 font-mono">{pool.creator.slice(0, 10)}...{pool.creator.slice(-8)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pools Created</span>
                <span className="font-medium">{pool.creatorStats.poolsCreated}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-medium">{pool.creatorStats.totalEarnings} CELO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Win Rate</span>
                <span className="font-medium text-green-600">{pool.creatorStats.winRate}</span>
              </div>
            </div>
          </Card>

          {/* Current Players */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Current Players ({pool.currentPlayers})</h3>
            <div className="space-y-3">
              {pool.players.map((player, index) => (
                <div key={player.address} className="flex items-center gap-3">
                  <img 
                    src={player.avatar} 
                    alt="Player" 
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-gray-500">Joined {player.joinedAt}</p>
                  </div>
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: pool.maxPlayers - pool.currentPlayers }, (_, index) => (
                <div key={`empty-${index}`} className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Waiting for player...</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            {canJoin && (
              <Button
                onClick={() => setShowJoinModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Join Game ({pool.entryFee} CELO)
              </Button>
            )}
            
            {pool.status === "ACTIVE" && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => window.location.href = `/game/${poolId}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Watch Game
              </Button>
            )}
            
            {!canJoin && pool.status === "OPENED" && (
              <Button
                disabled
                className="w-full"
                size="lg"
              >
                Pool Full
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      <JoinPoolModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}