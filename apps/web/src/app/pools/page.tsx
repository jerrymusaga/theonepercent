"use client";

import { useState } from "react";
import { Search, Filter, Users, Coins, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock data for demonstration - will be replaced with real contract data
const mockPools = [
  {
    id: 1,
    creator: "0x1234...5678",
    creatorName: "@alice",
    creatorAvatar: "/api/placeholder/32/32",
    entryFee: "2.5",
    maxPlayers: 8,
    currentPlayers: 6,
    prizePool: "20.0",
    status: "OPENED",
    createdAt: "2m ago",
    timeLeft: "5m 30s"
  },
  {
    id: 2,
    creator: "0x8765...4321",
    creatorName: "@bob",
    creatorAvatar: "/api/placeholder/32/32",
    entryFee: "1.0",
    maxPlayers: 4,
    currentPlayers: 4,
    prizePool: "4.0",
    status: "ACTIVE",
    createdAt: "5m ago",
    currentRound: 2,
    remainingPlayers: 2
  },
  {
    id: 3,
    creator: "0x9876...1234",
    creatorName: "@charlie",
    creatorAvatar: "/api/placeholder/32/32",
    entryFee: "5.0",
    maxPlayers: 6,
    currentPlayers: 3,
    prizePool: "15.0",
    status: "OPENED",
    createdAt: "8m ago",
    timeLeft: "12m 45s"
  },
  {
    id: 4,
    creator: "0x4567...8901",
    creatorName: "@diana",
    creatorAvatar: "/api/placeholder/32/32",
    entryFee: "0.5",
    maxPlayers: 12,
    currentPlayers: 8,
    prizePool: "6.0",
    status: "OPENED",
    createdAt: "15m ago",
    timeLeft: "3m 12s"
  }
];

const StatusBadge = ({ status, currentRound, remainingPlayers }: { 
  status: string; 
  currentRound?: number;
  remainingPlayers?: number;
}) => {
  if (status === "ACTIVE") {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Round {currentRound} • {remainingPlayers} left
      </div>
    );
  }
  
  if (status === "OPENED") {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        <Users className="w-3 h-3" />
        Waiting for players
      </div>
    );
  }
  
  return (
    <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
      {status}
    </div>
  );
};

const PoolCard = ({ pool }: { pool: typeof mockPools[0] }) => {
  const fillPercentage = (pool.currentPlayers / pool.maxPlayers) * 100;
  const canActivate = fillPercentage >= 50;
  
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 opacity-5">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
      </div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              #{pool.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <img 
                  src={pool.creatorAvatar} 
                  alt="Creator" 
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">{pool.creatorName}</span>
              </div>
              <p className="text-xs text-gray-500">{pool.createdAt}</p>
            </div>
          </div>
          <StatusBadge 
            status={pool.status} 
            currentRound={pool.currentRound}
            remainingPlayers={pool.remainingPlayers}
          />
        </div>

        {/* Prize Pool & Entry Fee */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coins className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Prize Pool</p>
              <p className="font-bold text-lg">{pool.prizePool} CELO</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500">Entry Fee</p>
            <p className="font-semibold">{pool.entryFee} CELO</p>
          </div>
        </div>

        {/* Players Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              Players: {pool.currentPlayers}/{pool.maxPlayers}
            </span>
            <span className="text-gray-500">{fillPercentage.toFixed(0)}% full</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                canActivate 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              }`}
              style={{ width: `${fillPercentage}%` }}
            ></div>
          </div>
          
          {canActivate && pool.status === "OPENED" && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              ✓ Can be activated (50%+ filled)
            </p>
          )}
        </div>

        {/* Time Remaining (for OPENED pools) */}
        {pool.status === "OPENED" && pool.timeLeft && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 rounded-lg">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              Auto-closes in: <span className="font-mono font-bold">{pool.timeLeft}</span>
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {pool.status === "OPENED" && (
            <>
              <Button 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={pool.currentPlayers >= pool.maxPlayers}
              >
                {pool.currentPlayers >= pool.maxPlayers ? "Pool Full" : "Join Game"}
              </Button>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </>
          )}
          
          {pool.status === "ACTIVE" && (
            <Button 
              variant="outline" 
              className="flex-1 border-green-200 hover:bg-green-50"
            >
              Watch Game
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function PoolsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent");

  const filteredPools = mockPools.filter(pool => {
    const matchesSearch = pool.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || pool.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Pools</h1>
            <p className="text-gray-600">Join a game or watch others compete in the minority-wins challenge</p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Create New Pool
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Pools</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Players Online</p>
                <p className="text-xl font-bold">47</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Prize Pool</p>
                <p className="text-xl font-bold">156.5 CELO</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Game Time</p>
                <p className="text-xl font-bold">8m 32s</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by creator name or pool ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="OPENED">Open</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="prize">Highest Prize</option>
            <option value="players">Most Players</option>
            <option value="ending">Ending Soon</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} />
        ))}
      </div>

      {/* Empty State */}
      {filteredPools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pools found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters, or create a new pool to get started.</p>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
            Create New Pool
          </Button>
        </div>
      )}

      {/* Load More */}
      {filteredPools.length > 0 && (
        <div className="text-center mt-8">
          <Button variant="outline">
            Load More Pools
          </Button>
        </div>
      )}
    </div>
  );
}