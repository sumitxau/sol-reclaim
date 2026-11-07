import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "SolReclaim | Reclaim Trapped Solana Rent",
  description: "Recover locked SOL from unused SPL and Token-2022 accounts.",
};

// Runs before first paint, so dark mode users never see a cream flash
const themeScript = `try{if(localStorage.getItem("theme")==="dark"){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={spaceMono.className}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}