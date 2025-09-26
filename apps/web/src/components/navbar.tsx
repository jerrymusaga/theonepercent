"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Target,
  Users,
  Trophy,
  Zap,
} from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WalletConnectButton } from "@/components/connect-button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Verify", href: "/verify" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  // Format address for display
  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-gray-800/50 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-3 md:px-6">
        {/* Left Section - Logo and Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700/50"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-80 bg-black border-gray-800/50 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-8 p-4 bg-gray-900/50 border border-gray-800/50">
                <div className="w-10 h-10 bg-red-600 border-2 border-red-500 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white uppercase tracking-wider">
                    THE ONE PERCENT
                  </span>
                
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 text-sm font-semibold px-4 py-3 transition-all duration-200 uppercase tracking-wider border-l-4 ${
                      pathname === link.href
                        ? "text-white bg-gray-800/50 border-l-red-500"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/30 border-l-transparent hover:border-l-gray-600"
                    }`}
                  >
                    {link.name === "Home" && <Target className="h-4 w-4" />}
                    {link.name === "Battles" && <Zap className="h-4 w-4" />}
                    {link.name === "Dashboard" && (
                      <Trophy className="h-4 w-4" />
                    )}
                    {link.name === "Verify" && <Users className="h-4 w-4" />}
                    {link.name}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t border-gray-800/50 px-4">
                  <WalletConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 border-2 border-red-500 flex items-center justify-center">
              <Target className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg md:text-xl text-white uppercase tracking-wider">
                OnePercent
              </span>
            
            </div>
          </Link>
        </div>

        {/* Center Section - Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 transition-all duration-200 uppercase tracking-wider border ${
                pathname === link.href
                  ? "text-white bg-gray-800/50 border-red-500/50"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/30 border-transparent hover:border-gray-600/50"
              }`}
            >
              {link.name === "Home" && <Target className="h-3 w-3" />}
              {link.name === "Battles" && <Zap className="h-3 w-3" />}
              {link.name === "Dashboard" && <Trophy className="h-3 w-3" />}
              {link.name === "Verify" && <Users className="h-3 w-3" />}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Section - Wallet */}
        <div className="flex items-center gap-3">
         

          {/* Wallet Connect Button */}
          <div className="wallet-connect-container">
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
