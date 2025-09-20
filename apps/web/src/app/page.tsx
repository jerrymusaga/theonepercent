"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Users, Coins, ArrowRight, Target, Zap, TrendingUp, Shield } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { context, isMiniAppReady } = useMiniApp();

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  
  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);
  
  // Extract user data from context
  const user = context?.user;
  // Use connected wallet address if available, otherwise fall back to user custody/verification
  const walletAddress = address || user?.custody || user?.verifications?.[0] || "0x1e4B...605B";
  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username || "@user";
  const pfpUrl = user?.pfpUrl;
  
  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading The One Percent...</p>
          </div>
        </section>
      </main>
    );
  }
  
  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-lg mx-auto p-8 text-center">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-2 mb-6">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-500 text-sm font-medium">Elite Gaming</span>
            </div>

            <h1 className="text-5xl font-bold text-white mb-4">
              The One
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                {" "}Percent
              </span>
            </h1>

            <p className="text-gray-300 text-lg mb-2">
              Where the minority wins
            </p>
            <p className="text-gray-400 mb-6">
              Elite prediction elimination game
            </p>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
              <p className="text-yellow-400 font-bold text-xl mb-3 text-center">
                💰 Real Money Elimination Game
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <p className="text-white text-sm"><strong>Join pools</strong> with real CELO entry fees (0.1 to 50 CELO)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <p className="text-white text-sm"><strong>Choose HEADS or TAILS</strong> - minority choice survives each round</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <p className="text-white text-sm"><strong>Win 95% of the prize pool</strong> as the last player standing</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-center">
                <p className="text-red-400 font-bold text-sm">
                  Example: 10 players × 5 CELO = 47.5 CELO to winner (95%) + 2.5 CELO creator reward! 💎
                </p>
              </div>
            </div>
          </div>
          
          {/* User Profile Card */}
          {isConnected && (
            <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700 p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {pfpUrl ? (
                      <img src={pfpUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{displayName}</h3>
                  <p className="text-gray-400 text-sm">{username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-gray-300 text-xs font-mono">{formatAddress(walletAddress)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Platform Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-8 h-8 text-yellow-400" />
                <h3 className="text-white font-bold text-lg">For Pool Creators</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">• <strong>Stake 5-50 CELO</strong> to create pools</p>
                <p className="text-gray-300 text-sm">• <strong>Earn 5% reward</strong> from completed pools</p>
                <p className="text-gray-300 text-sm">• <strong>+1 bonus pool</strong> when verified</p>
                <p className="text-yellow-400 text-sm font-semibold">• Example: 10 CELO stake = 2 pools + verification bonus</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-8 h-8 text-green-400" />
                <h3 className="text-white font-bold text-lg">For Players</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">• <strong>No staking required</strong> - just join and play</p>
                <p className="text-gray-300 text-sm">• <strong>Instant CELO payouts</strong> when you win</p>
                <p className="text-gray-300 text-sm">• <strong>Transparent blockchain</strong> - no cheating possible</p>
                <p className="text-green-400 text-sm font-semibold">• Win 95% of prize pool in minutes!</p>
              </div>
            </Card>
          </div>

          {/* Verification Benefits */}
          <Card className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-emerald-500/30 p-6 mb-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-8 h-8 text-emerald-400" />
                <h3 className="text-xl font-bold text-white">Get Verified = More Rewards</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-red-400 text-2xl">🚫</span>
                  </div>
                  <p className="text-white font-semibold">Unverified</p>
                  <p className="text-gray-400 text-sm">5 CELO = 1 pool</p>
                  <p className="text-gray-400 text-sm">No bonus rewards</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-emerald-400 text-2xl">✅</span>
                  </div>
                  <p className="text-emerald-400 font-semibold">Verified Player</p>
                  <p className="text-white text-sm">5 CELO = 1 pool + 1 bonus</p>
                  <p className="text-emerald-400 text-sm">100% more pools!</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-400 text-2xl">👑</span>
                  </div>
                  <p className="text-yellow-400 font-semibold">Verified Creator</p>
                  <p className="text-white text-sm">10 CELO = 2 pools + 1 bonus</p>
                  <p className="text-yellow-400 text-sm">+ 5% creator rewards</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-400 font-bold text-sm">
                  💡 Verification via Self Protocol takes 2 minutes and doubles your pool creation power!
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col gap-4 mb-8">
            <Button
              onClick={() => router.push('/pools')}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-6 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-yellow-500/25"
            >
              <Users className="w-5 h-5 mr-2" />
              Join a Game Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="border-2 border-gray-600 hover:border-yellow-500 text-gray-300 hover:text-yellow-500 py-4 px-6 rounded-lg transition-all duration-300"
              >
                <Coins className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              <Button
                onClick={() => router.push('/verify')}
                variant="outline"
                className="border-2 border-gray-600 hover:border-green-500 text-gray-300 hover:text-green-500 py-4 px-6 rounded-lg transition-all duration-300"
              >
                <Shield className="w-4 h-4 mr-2" />
                Get Verified
              </Button>
            </div>
          </div>
          

        </div>
      </section>
    </main>
  );
}
