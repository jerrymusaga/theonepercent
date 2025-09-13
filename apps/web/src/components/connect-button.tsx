"use client"

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMiniApp } from '@/contexts/miniapp-context'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { context, isMiniAppReady } = useMiniApp()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        Connect Wallet
      </button>
    )
  }

  // If in Farcaster Frame context and wallet not connected, try frame wallet first
  if (isMiniAppReady && !isConnected && context) {
    const frameConnector = connectors.find(connector => connector.id === 'frameWallet')
    
    if (frameConnector) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => connect({ connector: frameConnector })}
            type="button"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Connect Frame Wallet
          </button>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                type="button"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Other Wallets
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      )
    }
  }

  // For regular web or if frame wallet not available, use RainbowKit
  return <ConnectButton />
}
