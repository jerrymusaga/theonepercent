"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Coins,
  TrendingDown,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Crown,
  Calculator,
  ArrowLeft,
  Zap,
  Info,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock creator unstaking data
const mockUnstakeData = {
  creator: {
    address: "0x1234...5678",
    name: "@alice",
    avatar: "/api/placeholder/64/64",
    stakedAmount: "25.0",
    stakedAt: "2024-03-10T10:00:00Z",
    stakingDays: 5
  },
  
  pools: {
    total: 5,
    completed: 3,
    active: 1,
    opened: 1,
    abandoned: 0
  },
  
  earnings: {
    claimed: "8.5",
    pending: "2.3",
    total: "10.8"
  },
  
  activePools: [
    {
      id: 15,
      status: "OPENED",
      entryFee: "2.5",
      currentPlayers: 6,
      maxPlayers: 8,
      createdAt: "5m ago",
      expectedReward: "1.0"
    },
    {
      id: 14,
      status: "ACTIVE",
      entryFee: "1.0",
      currentRound: 2,
      playersLeft: 2,
      expectedReward: "0.2"
    }
  ],
  
  completedPools: [
    { id: 13, reward: "1.5", completedAt: "2h ago" },
    { id: 12, reward: "0.525", completedAt: "4h ago" },
    { id: 11, reward: "1.275", completedAt: "1d ago" }
  ]
};

const UnstakeCalculator = ({ 
  stakedAmount, 
  earnings, 
  hasIncompletePools 
}: { 
  stakedAmount: number;
  earnings: any;
  hasIncompletePools: boolean;
}) => {
  const penaltyRate = 0.3; // 30% penalty
  const penalty = hasIncompletePools ? stakedAmount * penaltyRate : 0;
  const stakeReturn = stakedAmount - penalty;
  const totalReturn = stakeReturn + parseFloat(earnings.pending);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        Unstaking Calculator
      </h3>
      
      <div className="space-y-4">
        {/* Current stake */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-blue-800">Original Stake</span>
          <span className="font-bold text-blue-600">{stakedAmount} CELO</span>
        </div>

        {/* Penalty (if applicable) */}
        {hasIncompletePools && (
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800">Early Withdrawal Penalty (30%)</span>
            </div>
            <span className="font-bold text-red-600">-{penalty.toFixed(2)} CELO</span>
          </div>
        )}

        {/* Stake return */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700">Stake Return</span>
          <span className={`font-bold ${hasIncompletePools ? 'text-orange-600' : 'text-green-600'}`}>
            {stakeReturn.toFixed(2)} CELO
          </span>
        </div>

        {/* Pending earnings */}
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-800">Pending Earnings</span>
          <span className="font-bold text-green-600">{earnings.pending} CELO</span>
        </div>

        {/* Total return */}
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border-2 border-blue-200">
          <span className="font-bold text-gray-900">Total You'll Receive</span>
          <span className="text-2xl font-bold text-blue-600">{totalReturn.toFixed(2)} CELO</span>
        </div>

        {/* Warning message */}
        {hasIncompletePools && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Early Withdrawal Warning</p>
                <p>You have {mockUnstakeData.pools.active + mockUnstakeData.pools.opened} incomplete pools. 
                   Unstaking now will abandon these pools and incur a 30% penalty on your stake.</p>
              </div>
            </div>
          </div>
        )}

        {!hasIncompletePools && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Perfect! No Penalty</p>
                <p>All your pools have completed successfully. You can unstake without any penalties.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const PoolStatusOverview = ({ pools, activePools }: { pools: any; activePools: any[] }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-purple-600" />
        Pool Status Overview
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-green-600">{pools.completed}</p>
          <p className="text-xs text-green-800">Completed</p>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{pools.active}</p>
          <p className="text-xs text-blue-800">Active</p>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pools.opened}</p>
          <p className="text-xs text-yellow-800">Waiting</p>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-red-600">{pools.abandoned}</p>
          <p className="text-xs text-red-800">Abandoned</p>
        </div>
      </div>

      {/* Active/Opened pools details */}
      {activePools.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Incomplete Pools:</h4>
          <div className="space-y-2">
            {activePools.map((pool) => (
              <div key={pool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    pool.status === 'ACTIVE' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    #{pool.id}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{pool.entryFee} CELO • {pool.status}</p>
                    <p className="text-xs text-gray-500">
                      {pool.status === 'ACTIVE' 
                        ? `Round ${pool.currentRound} • ${pool.playersLeft} left`
                        : `${pool.currentPlayers}/${pool.maxPlayers} players`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{pool.expectedReward} CELO</p>
                  <p className="text-xs text-gray-500">Expected reward</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

const EarningsBreakdown = ({ earnings }: { earnings: any }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-600" />
        Earnings Breakdown
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-800">Already Claimed</span>
          </div>
          <span className="font-bold text-green-600">{earnings.claimed} CELO</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800">Pending (Will be claimed)</span>
          </div>
          <span className="font-bold text-blue-600">{earnings.pending} CELO</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <span className="font-bold text-purple-800">Total Lifetime Earnings</span>
          <span className="text-xl font-bold text-purple-600">{earnings.total} CELO</span>
        </div>
      </div>
    </Card>
  );
};

const UnstakeConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  hasIncompletePools,
  calculatedReturn
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  hasIncompletePools: boolean;
  calculatedReturn: number;
}) => {
  const [confirmText, setConfirmText] = useState("");
  const requiredText = hasIncompletePools ? "ABANDON POOLS" : "UNSTAKE";
  const canConfirm = confirmText === requiredText;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          {hasIncompletePools ? (
            <>
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Confirm Early Unstaking</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Confirm Unstaking</span>
            </>
          )}
        </h3>
        
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            hasIncompletePools 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <p className={`font-medium mb-2 ${
              hasIncompletePools ? 'text-red-900' : 'text-green-900'
            }`}>
              {hasIncompletePools ? 'This action will:' : 'You will receive:'}
            </p>
            <ul className={`text-sm space-y-1 ${
              hasIncompletePools ? 'text-red-800' : 'text-green-800'
            }`}>
              {hasIncompletePools ? (
                <>
                  <li>• Abandon {mockUnstakeData.pools.active + mockUnstakeData.pools.opened} incomplete pools</li>
                  <li>• Apply 30% penalty to your stake</li>
                  <li>• Refund players from abandoned pools</li>
                  <li>• Forfeit potential earnings from incomplete pools</li>
                </>
              ) : (
                <>
                  <li>• Full stake return with no penalties</li>
                  <li>• All pending creator rewards</li>
                  <li>• Complete your creator journey successfully</li>
                </>
              )}
            </ul>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-blue-800">You'll receive:</span>
              <span className="text-xl font-bold text-blue-600">{calculatedReturn.toFixed(2)} CELO</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "{requiredText}" to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={requiredText}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex-1 ${
              hasIncompletePools 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {hasIncompletePools ? 'Abandon & Unstake' : 'Unstake'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default function UnstakePage() {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const data = mockUnstakeData;
  const hasIncompletePools = data.pools.active + data.pools.opened > 0;
  const stakedAmount = parseFloat(data.creator.stakedAmount);
  const penalty = hasIncompletePools ? stakedAmount * 0.3 : 0;
  const stakeReturn = stakedAmount - penalty;
  const totalReturn = stakeReturn + parseFloat(data.earnings.pending);

  const handleUnstake = async () => {
    setIsUnstaking(true);
    setShowConfirmation(false);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsUnstaking(false);
    setShowSuccess(true);
    
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Unstaking Complete!</h2>
          <p className="text-gray-600 mb-4">
            You've received {totalReturn.toFixed(2)} CELO and your creator stake has been withdrawn.
          </p>
          {hasIncompletePools && (
            <div className="p-3 bg-orange-50 rounded-lg mb-4">
              <p className="text-sm text-orange-800">
                {data.pools.active + data.pools.opened} pools were abandoned and players have been refunded.
              </p>
            </div>
          )}
          <div className="animate-pulse text-blue-600">
            Redirecting to home...
          </div>
        </Card>
      </div>
    );
  }

  if (isUnstaking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Processing Unstake...</h2>
          <p className="text-gray-600 mb-4">
            {hasIncompletePools 
              ? 'Abandoning incomplete pools and processing penalty...'
              : 'Claiming rewards and returning your stake...'
            }
          </p>
          <p className="text-sm text-gray-500">This may take a few moments.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              Unstake & Withdraw
            </h1>
            <p className="text-gray-600">
              Withdraw your creator stake and claim pending earnings
            </p>
          </div>
        </div>

        {/* Creator status */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <img 
              src={data.creator.avatar} 
              alt="Creator"
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                <span className="font-bold">{data.creator.name}</span>
              </div>
              <p className="text-sm opacity-90">
                Staked {data.creator.stakedAmount} CELO • {data.creator.stakingDays} days ago
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total Pools Created</p>
              <p className="text-xl font-bold">{data.pools.total}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pool status */}
          <PoolStatusOverview pools={data.pools} activePools={data.activePools} />
          
          {/* Earnings breakdown */}
          <EarningsBreakdown earnings={data.earnings} />
        </div>

        {/* Unstake calculator */}
        <div className="mb-6">
          <UnstakeCalculator 
            stakedAmount={stakedAmount}
            earnings={data.earnings}
            hasIncompletePools={hasIncompletePools}
          />
        </div>

        {/* Action section */}
        <Card className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-4">
              {hasIncompletePools ? 'Early Unstaking' : 'Ready to Unstake'}
            </h3>
            
            <div className={`p-4 rounded-lg mb-6 ${
              hasIncompletePools 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-2xl font-bold mb-2 ${
                hasIncompletePools ? 'text-red-600' : 'text-green-600'
              }`}>
                {totalReturn.toFixed(2)} CELO
              </p>
              <p className={`text-sm ${
                hasIncompletePools ? 'text-red-800' : 'text-green-800'
              }`}>
                Total amount you'll receive
                {hasIncompletePools && (
                  <span className="block mt-1">
                    (After 30% penalty: -{penalty.toFixed(2)} CELO)
                  </span>
                )}
              </p>
            </div>

            <Button
              onClick={() => setShowConfirmation(true)}
              className={`w-full text-lg py-4 ${
                hasIncompletePools 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              size="lg"
            >
              {hasIncompletePools ? (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Unstake Early (With Penalty)
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 mr-2" />
                  Unstake & Claim Rewards
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-3">
              {hasIncompletePools 
                ? 'Consider waiting for your pools to complete to avoid the penalty'
                : 'Congratulations on completing all your pools successfully!'
              }
            </p>
          </div>
        </Card>

        {/* Confirmation modal */}
        <UnstakeConfirmationModal 
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleUnstake}
          hasIncompletePools={hasIncompletePools}
          calculatedReturn={totalReturn}
        />
      </div>
    </div>
  );
}