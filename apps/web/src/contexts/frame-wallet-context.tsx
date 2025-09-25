"use client";

import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { injected, walletConnect, coinbaseWallet, metaMask } from 'wagmi/connectors';
import '@rainbow-me/rainbowkit/styles.css';

const { wallets } = getDefaultWallets();

const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    farcasterMiniApp(),
    injected(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fallback-project-id' 
    }),
    coinbaseWallet({ appName: 'theonepercent' }),
    metaMask(),
  ],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_MAINNET_RPC),
    [celoAlfajores.id]: http(process.env.NEXT_PUBLIC_CELO_TESTNET_RPC),
  },
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
