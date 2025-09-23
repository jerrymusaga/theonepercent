"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useMiniApp } from "@/contexts/miniapp-context";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ChevronDown } from "lucide-react";

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { context, isMiniAppReady } = useMiniApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200">
        <Wallet className="w-3 h-3" />
        CONNECT
      </button>
    );
  }

  // If in Farcaster Frame context and wallet not connected, try frame wallet first
  if (isMiniAppReady && !isConnected && context) {
    const frameConnector = connectors.find(
      (connector) => connector.id === "frameWallet"
    );

    if (frameConnector) {
      return (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => connect({ connector: frameConnector })}
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200"
          >
            <Wallet className="w-3 h-3" />
            FRAME
          </button>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                type="button"
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200"
              >
                <Wallet className="w-3 h-3" />
                OTHER
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      );
    }
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted: rainbowMounted,
      }) => {
        const ready = rainbowMounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <Wallet className="w-3 h-3" />
                    <span className="hidden sm:inline">CONNECT</span>
                    <span className="sm:hidden">CONNECT</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200"
                  >
                    WRONG NETWORK
                    <ChevronDown className="w-3 h-3" />
                  </button>
                );
              }

              // When connected, show only the account button - chain selector will be in the dropdown
              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-500 text-white font-semibold uppercase tracking-wide text-xs transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <div className="w-4 h-4 bg-white/20 border border-white/30 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {account.address.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden md:inline">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </span>
                  <span className="md:hidden">
                    {account.address.slice(0, 4)}...
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
