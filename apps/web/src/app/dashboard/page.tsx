"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Crown,
  TrendingUp,
  Users,
  Coins,
  Clock,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Trophy,
  Target,
  BarChart3,
  Zap,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock creator dashboard data
const mockDashboardData = {
  creator: {
    address: "0x1234...5678",
    name: "@alice",
    avatar: "/api/placeholder/64/64",
    stakedAmount: "25.0",
    poolsCreated: 12,
    poolsRemaining: 3,
    totalEarnings: "18.7",
    activeStake: true,
    stakedAt: "2024-03-10T10:00:00Z",
    reputation: "Gold Creator" // Based on successful pools
  },
  
  stats: {
    totalRevenue: "18.7",
    averagePoolSize: "6.2",
    completionRate: "85%",
    averageGameTime: "8m 45s",
    bestPerformingEntry: "2.5 CELO",
    totalPlayersHosted: 74
  },
  
  activePools: [
    {
      id: 15,
      entryFee: "2.5",
      maxPlayers: 8,
      currentPlayers: 6,
      prizePool: "20.0",
      status: "OPENED",
      createdAt: "5m ago",
      autoCloseIn: "7m 23s",
      expectedReward: "1.0"
    },
    {
      id: 14,
      entryFee: "1.0",
      maxPlayers: 4,
      currentPlayers: 4,
      prizePool: "4.0",
      status: "ACTIVE",
      createdAt: "12m ago",
      currentRound: 2,
      playersLeft: 2,
      expectedReward: "0.2"
    }
  ],
  
  recentPools: [
    {
      id: 13,
      entryFee: "5.0",
      maxPlayers: 6,
      finalPlayers: 6,
      prizePool: "30.0",
      status: "COMPLETED",
      completedAt: "2h ago",
      winner: "@player4",
      duration: "12m 34s",
      rounds: 4,
      earnedReward: "1.5"
    },
    {
      id: 12,
      entryFee: "1.5",
      maxPlayers: 10,
      finalPlayers: 7,
      prizePool: "10.5",
      status: "COMPLETED",
      completedAt: "4h ago",
      winner: "@player2",
      duration: "6m 12s",
      rounds: 2,
      earnedReward: "0.525"
    },
    {
      id: 11,
      entryFee: "2.0",
      maxPlayers: 8,
      finalPlayers: 3,
      prizePool: "6.0",
      status: "ABANDONED",
      abandonedAt: "1d ago",
      reason: "Insufficient players",
      earnedReward: "0"
    }
  ]
};

const CreatorStatsOverview = ({ creator, stats }: { creator: any; stats: any }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total earnings */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500 rounded-full">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-sm font-medium text-green-800 mb-1">Total Earnings</h3>
        <p className="text-2xl font-bold text-green-600">{creator.totalEarnings} CELO</p>
        <p className="text-xs text-green-700 mt-1">From {creator.poolsCreated} pools created</p>
      </Card>

      {/* Active pools */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <Play className="w-6 h-6 text-white" />
          </div>
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-medium text-blue-800 mb-1">Active Pools</h3>
        <p className="text-2xl font-bold text-blue-600">{mockDashboardData.activePools.length}</p>
        <p className="text-xs text-blue-700 mt-1">{creator.poolsRemaining} slots remaining</p>
      </Card>

      {/* Success rate */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500 rounded-full">
            <Target className="w-6 h-6 text-white" />
          </div>
          <BarChart3 className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-sm font-medium text-purple-800 mb-1">Success Rate</h3>
        <p className="text-2xl font-bold text-purple-600">{stats.completionRate}</p>
        <p className="text-xs text-purple-700 mt-1">Pools completed successfully</p>
      </Card>

      {/* Average pool size */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500 rounded-full">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-sm font-medium text-orange-800 mb-1">Avg Pool Size</h3>
        <p className="text-2xl font-bold text-orange-600">{stats.averagePoolSize}</p>
        <p className="text-xs text-orange-700 mt-1">Players per pool</p>
      </Card>
    </div>
  );
};

const PoolCard = ({ pool, isActive = false }: { pool: any; isActive?: boolean }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPENED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ABANDONED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPENED': return <Users className="w-4 h-4" />;
      case 'ACTIVE': return <Play className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'ABANDONED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            #{pool.id}
          </div>
          <div>
            <p className="font-medium text-gray-900">Pool #{pool.id}</p>
            <p className="text-sm text-gray-500">
              {isActive ? pool.createdAt : 
               pool.status === 'COMPLETED' ? `Completed ${pool.completedAt}` :
               `Abandoned ${pool.abandonedAt}`}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(pool.status)}`}>
          {getStatusIcon(pool.status)}
          {pool.status}
        </div>
      </div>

      {/* Pool details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">Entry Fee</span>
          </div>
          <p className="font-bold">{pool.entryFee} CELO</p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Players</span>
          </div>
          <p className="font-bold">
            {isActive ? `${pool.currentPlayers}/${pool.maxPlayers}` : 
             pool.finalPlayers ? `${pool.finalPlayers}/${pool.maxPlayers}` :
             `${pool.currentPlayers || 0}/${pool.maxPlayers}`}
          </p>
        </div>
      </div>

      {/* Status-specific info */}
      {pool.status === 'OPENED' && (
        <div className="p-3 bg-blue-50 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800">Auto-closes in:</span>
            <span className="font-mono font-bold text-blue-600">{pool.autoCloseIn}</span>
          </div>
        </div>
      )}

      {pool.status === 'ACTIVE' && (
        <div className="p-3 bg-green-50 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-green-800">Round {pool.currentRound}:</span>
            <span className="font-bold text-green-600">{pool.playersLeft} players left</span>
          </div>
        </div>
      )}

      {pool.status === 'COMPLETED' && (
        <div className="p-3 bg-green-50 rounded-lg mb-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800">Winner:</span>
              <span className="font-bold text-green-600">{pool.winner}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800">Duration:</span>
              <span className="font-mono text-green-600">{pool.duration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-800">Your reward:</span>
              <span className="font-bold text-green-600">{pool.earnedReward} CELO</span>
            </div>
          </div>
        </div>
      )}

      {pool.status === 'ABANDONED' && (
        <div className="p-3 bg-red-50 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-red-800">Reason:</span>
            <span className="text-red-600">{pool.reason}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {pool.status === 'OPENED' && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.location.href = `/pools/${pool.id}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Pool
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </>
        )}
        
        {pool.status === 'ACTIVE' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.location.href = `/game/${pool.id}`}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Game
          </Button>
        )}
        
        {pool.status === 'COMPLETED' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.location.href = `/game/${pool.id}/complete`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Results
          </Button>
        )}
      </div>
    </Card>
  );
};

export default function CreatorDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const data = mockDashboardData;

  // Redirect if not a creator
  useEffect(() => {
    if (!data.creator.activeStake) {
      router.push('/stake');
    }
  }, [data.creator.activeStake, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src={data.creator.avatar} 
              alt="Creator"
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="w-8 h-8 text-yellow-600" />
                Creator Dashboard
              </h1>
              <p className="text-gray-600">
                {data.creator.name} • {data.creator.reputation} • 
                Staked: {data.creator.stakedAmount} CELO
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600"
              onClick={() => router.push('/create-pool')}
              disabled={data.creator.poolsRemaining <= 0}
            >
              <Zap className="w-4 h-4 mr-2" />
              Create Pool ({data.creator.poolsRemaining} left)
            </Button>
          </div>
        </div>

        {/* Stats overview */}
        <CreatorStatsOverview creator={data.creator} stats={data.stats} />

        {/* No pools remaining warning */}
        {data.creator.poolsRemaining <= 0 && (
          <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">All pool slots used</p>
                <p className="text-sm text-orange-700">
                  Complete your active pools to free up slots, or consider staking more CELO for additional pools.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active pools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                Active Pools ({data.activePools.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {data.activePools.length > 0 ? (
                data.activePools.map((pool) => (
                  <PoolCard key={pool.id} pool={pool} isActive={true} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active pools</h3>
                  <p className="text-gray-500 mb-4">Create a new pool to start earning creator rewards.</p>
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                    onClick={() => router.push('/create-pool')}
                    disabled={data.creator.poolsRemaining <= 0}
                  >
                    Create Your First Pool
                  </Button>
                </Card>
              )}
            </div>
          </div>

          {/* Recent pools */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Recent Pools
              </h2>
            </div>
            
            <div className="space-y-4">
              {data.recentPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>

            {/* View all pools */}
            <div className="mt-6 text-center">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View All Pool History
              </Button>
            </div>
          </div>
        </div>

        {/* Performance insights */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Performance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Best Entry Fee</h4>
              <p className="text-2xl font-bold text-blue-600">{data.stats.bestPerformingEntry}</p>
              <p className="text-sm text-blue-700">Highest completion rate</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Avg Game Time</h4>
              <p className="text-2xl font-bold text-green-600">{data.stats.averageGameTime}</p>
              <p className="text-sm text-green-700">From start to finish</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Players Hosted</h4>
              <p className="text-2xl font-bold text-purple-600">{data.stats.totalPlayersHosted}</p>
              <p className="text-sm text-purple-700">Total across all pools</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}