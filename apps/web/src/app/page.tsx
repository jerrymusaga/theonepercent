"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  Trophy,
  TrendingUp,
  ArrowRight,
  Coins,
  Target,
  CheckCircle,
  Star,
  Shield,
  Info,
} from "lucide-react";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEnvioActivePools } from "@/hooks/use-envio-pools";
import { formatEther } from "viem";

export default function Home() {
  const router = useRouter();
  const { context, isMiniAppReady } = useMiniApp();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const [demoStep, setDemoStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  // Get live game data for social proof
  const { data: activePools = [] } = useEnvioActivePools();

  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (
      isMiniAppReady &&
      !isConnected &&
      !isConnecting &&
      connectors.length > 0
    ) {
      const farcasterConnector = connectors.find((c) => c.id === "farcaster");
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);

  // Demo animation steps
  const demoSteps = [
    { text: "10 players join a game", players: 10, eliminated: 0 },
    { text: "Round 1: 7 choose Heads, 3 choose Tails", players: 10, eliminated: 0, choice: "3 choose minority (Tails)" },
    { text: "Majority eliminated! 7 players out", players: 3, eliminated: 7 },
    { text: "Round 2: 2 choose Heads, 1 chooses Tails", players: 3, eliminated: 7, choice: "1 chooses minority (Tails)" },
    { text: "Winner! Last player takes all", players: 1, eliminated: 9, winner: true },
  ];

  useEffect(() => {
    if (showDemo) {
      const interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % demoSteps.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [showDemo, demoSteps.length]);

  // Calculate total value locked from active pools
  const totalValueLocked = activePools.reduce((sum, pool) => {
    return sum + Number(formatEther(pool.prizePool || 0n));
  }, 0);

  const recentWinners = [
    { name: "0x42d1...a8b3", amount: "12.5 CELO", game: "Pool #1247" },
    { name: "0x7f91...c2e4", amount: "8.2 CELO", game: "Pool #1246" },
    { name: "0x1a5b...9d6c", amount: "15.7 CELO", game: "Pool #1245" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <section className="px-4 py-16 md:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8">
                {/* Main Headline */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
                    Win by Being
                    <span className="block bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
                      Different
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                    The elimination game where minority wins. Join pools, make binary choices,
                    and win by choosing differently than the majority. Last player takes all!
                  </p>
                </div>

                {/* Value Proposition Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
                  <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Think Differently</h3>
                      <p className="text-gray-400 text-sm">
                        Each round, choose Heads or Tails. Players who pick the minority option advance to the next round.
                      </p>
                    </div>
                  </Card>

                  <Card className="bg-gray-900/50 border-gray-800 p-6 backdrop-blur-sm">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Elimination Style</h3>
                      <p className="text-gray-400 text-sm">
                        Majority players are eliminated each round. Last survivor wins the entire prize pool.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Creator Benefits */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-6 max-w-4xl mx-auto mt-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-white flex items-center justify-center gap-2">
                      <Shield className="w-6 h-6 text-purple-400" />
                      Create Pools & Earn Rewards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-purple-200">
                          <strong>Creator Rewards:</strong> Earn 5% of every prize pool you create
                        </p>
                        <p className="text-purple-200">
                          <strong>Stake to Create:</strong> Minimum 5 CELO stake, 1 pool per 5 CELO
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-blue-200">
                          <strong>Get Verified:</strong> Use Self Protocol for bonus pool allowances
                        </p>
                        <p className="text-blue-200">
                          <strong>Build Trust:</strong> Verified creators get enhanced discoverability
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold"
                    onClick={() => router.push("/dashboard")}
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Start Playing or Creating
                  </Button>
                  <Button
                    size="lg"
                    className="bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500 px-8 py-4 text-lg font-semibold"
                    onClick={() => setShowDemo(true)}
                  >
                    See How It Works
                    <Info className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Demo Modal */}
          {showDemo && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-gray-900 border-gray-800 p-8 max-w-2xl w-full">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">How The One Percent Works</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDemo(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-sm text-blue-200">
                    <strong>Game Rule:</strong> In each round, choose Heads or Tails. Players who pick the minority option advance, majority players are eliminated. Last survivor wins the entire prize pool!
                  </div>

                  {/* Demo Animation */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      <p className="text-lg text-white font-medium">
                        {demoSteps[demoStep].text}
                      </p>

                      {/* Visual Players */}
                      <div className="flex justify-center space-x-2 flex-wrap">
                        {[...Array(demoSteps[demoStep].players)].map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          >
                            ✓
                          </div>
                        ))}
                        {[...Array(demoSteps[demoStep].eliminated)].map((_, i) => (
                          <div
                            key={`elim-${i}`}
                            className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-50"
                          >
                            ✕
                          </div>
                        ))}
                      </div>

                      {demoSteps[demoStep].choice && (
                        <p className="text-sm text-yellow-400 font-medium">
                          {demoSteps[demoStep].choice}
                        </p>
                      )}

                      {demoSteps[demoStep].winner && (
                        <div className="space-y-2">
                          <p className="text-xl text-yellow-400 font-bold">🎉 WINNER! 🎉</p>
                          <p className="text-green-400 font-medium">Wins entire prize pool!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        setShowDemo(false);
                        router.push("/pools");
                      }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Join a Pool Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDemo(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Got It!
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Live Stats Section - Hidden on mobile/Farcaster */}
          <section className="hidden md:block px-4 py-16 bg-gray-900/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Live Game Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700 p-6 text-center">
                    <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-white">
                      {totalValueLocked.toFixed(1)} CELO
                    </p>
                    <p className="text-gray-400 text-sm">Total Prize Pools</p>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700 p-6 text-center">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-white">{activePools.length}</p>
                    <p className="text-gray-400 text-sm">Active Games</p>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700 p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-white">95%</p>
                    <p className="text-gray-400 text-sm">Payout Rate</p>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700 p-6 text-center">
                    <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-white">Instant</p>
                    <p className="text-gray-400 text-sm">Secure Payouts</p>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Winners - Hidden on mobile/Farcaster */}
          <section className="hidden md:block px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Recent Winners
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentWinners.map((winner, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-700 p-6">
                      <div className="text-center space-y-3">
                        <Star className="w-8 h-8 text-yellow-400 mx-auto" />
                        <p className="text-white font-medium">{winner.name}</p>
                        <p className="text-xl font-bold text-green-400">{winner.amount}</p>
                        <p className="text-gray-400 text-sm">{winner.game}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}