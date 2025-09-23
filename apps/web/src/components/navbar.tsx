"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, Crown, Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { WalletConnectButton } from "@/components/connect-button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Verify", href: "/verify" },
  { name: "Docs", href: "https://docs.celo.org", external: true },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur-md">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-80 bg-gray-900 border-gray-800"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="font-bold text-lg text-white">
                  THE ONE PERCENT
                </span>
              </div>
              <nav className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
                      pathname === link.href
                        ? "text-white bg-gray-800"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    {link.name}
                    {link.external && <ExternalLink className="h-4 w-4" />}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <WalletConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="hidden font-bold text-lg text-white sm:inline-block">
              THE ONE PERCENT
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 uppercase tracking-wider ${
                pathname === link.href
                  ? "text-white bg-gray-800"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {link.name}
              {link.external && <ExternalLink className="h-3 h-3" />}
            </Link>
          ))}

          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-800">
            <WalletConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
