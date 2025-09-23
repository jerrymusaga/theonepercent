"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Crown,
  Users,
  Coins,
  ArrowRight,
  Target,
  Zap,
  TrendingUp,
  Shield,
  Play,
  Trophy,
  Skull,
  Gamepad2,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { context, isMiniAppReady } = useMiniApp();
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

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

  // Loading progress animation
  useEffect(() => {
    if (!isMiniAppReady) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + Math.random() * 15;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isMiniAppReady]);

  // Extract user data from context
  const user = context?.user;
  const walletAddress =
    address || user?.custody || user?.verifications?.[0] || "0x1e4B...605B";
  const displayName = user?.displayName || user?.username || "Player";
  const username = user?.username || "@player";
  const pfpUrl = user?.pfpUrl;

  // Format wallet address
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isMiniAppReady) {
    return (
      <main className="flex-1 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-red-950">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
          </div>

          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center space-y-8 max-w-sm mx-auto">
              {/* Skull Icon */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto relative">
                  <Skull className="w-full h-full text-red-500 drop-shadow-2xl animate-pulse" />
                  <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                </div>
              </div>

              {/* App Title */}
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  THE ONE PERCENT
                </h1>
                <p className="text-red-400 text-sm font-medium">
                  MINORITY WINS
                </p>
              </div>

              {/* Loading Progress */}
              <div className="space-y-4">
                <div className="text-right">
                  <span className="text-red-500 text-4xl font-bold">
                    {Math.min(Math.round(loadingProgress), 100)}%
                  </span>
                  <span className="text-white text-lg ml-2">LOADING</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-gray-400 text-xs">
                Initializing gaming protocol...
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 relative overflow-hidden">
      {/* Background with gaming aesthetic */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-500 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md mx-auto space-y-8">
            {/* Logo/Brand Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl">
                <Crown className="w-10 h-10 text-yellow-400" />
              </div>

              <div>
                <h1 className="text-4xl font-black text-white leading-tight">
                  THE ONE
                  <span className="block bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
                    PERCENT
                  </span>
                </h1>
                <p className="text-gray-400 text-sm mt-2 font-medium">
                  WHERE MINORITY WINS
                </p>
              </div>
            </div>

            {/* Player Status */}
            {isConnected && (
              <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-xl p-0.5">
                    <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                      {pfpUrl ? (
                        <img
                          src={pfpUrl}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Gamepad2 className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {displayName}
                    </p>
                    <p className="text-gray-400 text-xs">{username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300 text-xs font-mono">
                        {formatAddress(walletAddress)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-gray-900/50 border-gray-800 p-3 text-center">
                <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">95%</p>
                <p className="text-gray-400 text-xs">WIN RATE</p>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800 p-3 text-center">
                <Target className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">LIVE</p>
                <p className="text-gray-400 text-xs">GAMES</p>
              </Card>
              <Card className="bg-gray-900/50 border-gray-800 p-3 text-center">
                <Coins className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-white text-xs font-bold">CELO</p>
                <p className="text-gray-400 text-xs">REWARDS</p>
              </Card>
            </div>

            {/* Game Description */}
            <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-4">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                    ELIMINATION PROTOCOL
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">1</span>
                    </div>
                    <p className="text-gray-200 text-xs font-medium">
                      Enter with{" "}
                      <span className="text-yellow-400 font-bold">CELO</span>{" "}
                      (0.1-50)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">2</span>
                    </div>
                    <p className="text-gray-200 text-xs font-medium">
                      Choose{" "}
                      <span className="text-red-400 font-bold">HEADS</span> or{" "}
                      <span className="text-red-400 font-bold">TAILS</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">3</span>
                    </div>
                    <p className="text-gray-200 text-xs font-medium">
                      <span className="text-green-400 font-bold">Minority</span>{" "}
                      survives, majority eliminated
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-3">
                  <div className="text-center bg-gray-800/50 rounded-lg p-3">
                    <p className="text-yellow-400 text-xs font-bold">
                      WINNER TAKES 95% OF THE POT
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/pools")}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 text-base rounded-xl shadow-lg shadow-red-600/25 transition-all duration-300 hover:scale-[1.02]"
              >
                <Play className="w-5 h-5 mr-2" />
                ENTER GAME
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="border-2 border-gray-700 hover:border-yellow-500 bg-gray-900/50 text-gray-300 hover:text-yellow-400 py-3 rounded-lg transition-all duration-300"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Stats
                </Button>
                <Button
                  onClick={() => router.push("/verify")}
                  variant="outline"
                  className="border-2 border-gray-700 hover:border-green-500 bg-gray-900/50 text-gray-300 hover:text-green-400 py-3 rounded-lg transition-all duration-300"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Verify
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Info Bar */}
        <div className="border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between text-xs text-gray-400 max-w-md mx-auto">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>BLOCKCHAIN SECURED</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>INSTANT PAYOUTS</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
