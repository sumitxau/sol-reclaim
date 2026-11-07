"use client";

import dynamic from "next/dynamic";
import { ThemeToggle } from "@/components/ThemeToggle";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export function Navbar() {
  return (
    <header className="nav-outer">
      <div className="nav-pill">
       <a href="#" className="brand-group" aria-label="SolReclaim home">
  <span className="brand-title">SolReclaim</span>
</a>

        <nav className="nav-links" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}