import { Navbar } from "@/components/Navbar";
import { ReclaimDashboard } from "@/components/ReclaimDashboard";
import { FEE_RATE, RPC_URL } from "@/config/constants";

// TODO: put your real repo link here
const GITHUB_URL = "https://github.com/sumitxau/sol-reclaim";

const feePct = Math.round(FEE_RATE * 100);
const isDevnet = RPC_URL.includes("devnet");

const STEPS = [
  { title: "Connect your wallet", text: "Phantom or Solflare. We only read your token accounts. Nothing moves yet." },
  { title: "Pick accounts to close", text: "Empty accounts are safe. Accounts with tokens burn those tokens first, so check each one." },
  { title: "Approve in your wallet", text: `You see the full transaction and sign it yourself. The rent returns to you minus a ${feePct}% fee.` },
];

const FAQ = [
  {
    q: "What is rent?",
    a: "Every token account on Solana must hold a small SOL deposit to exist. For a standard token account it is about 0.00204 SOL. When you close the account, that deposit comes back to your wallet.",
  },
  {
    q: "Is it safe?",
    a: "SolReclaim never holds your SOL or your keys. Every transaction is shown in your own wallet and you sign it yourself. Read the preview in your wallet before you approve. Closing an empty account does not remove any tokens.",
  },
  {
    q: "Why is there a fee?",
    a: `SolReclaim keeps ${feePct}% of the rent that comes back, to cover the cost of running the service. The fee is a normal SOL transfer inside the same transaction, so you can see it in your wallet preview and on Solscan.`,
  },
  {
    q: "What does burning mean?",
    a: "A token account that still holds tokens cannot be closed. To close it, the tokens are burned first. Burning destroys them permanently. That tab can also list NFTs and tokens that have value, so only select tokens you are sure you do not want.",
  },
  {
    q: "Will I lose anything by closing empty accounts?",
    a: "No. If you receive that token again later, a new account is created for it.",
  },
];

export default function HomePage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main>
        <section className="hero">
          <div className="eyebrow-row">
            <span className="eyebrow"><span className="pulse" />Solana rent recovery</span>
            {isDevnet && <span className="net-badge">Devnet · test mode</span>}
          </div>
          <h1 className="hero-title">
            Get your <span className="grad">locked SOL</span> back.
          </h1>
          <p className="hero-sub">
            Every unused token account on Solana holds about 0.00204 SOL in rent. Close the
            ones you do not need and the SOL returns to your wallet.
          </p>
          <div className="hero-actions">
            <a href="#app" className="btn btn-primary">Start reclaiming</a>
            <a href="#how" className="btn btn-outline">How it works</a>
          </div>
          <div className="trust-row">
            <span className="trust-pill">Non-custodial</span>
            <span className="trust-pill">{feePct}% fee shown before you sign</span>
            <span className="trust-pill">SPL + Token-2022</span>
          </div>
        </section>

        <ReclaimDashboard />

        <section id="how" className="section">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="step-card">
                <div className="step-num">{i + 1}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-text">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="section">
          <h2 className="section-title">Questions</h2>
          <div className="faq-list">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
            <details className="faq-item">
              <summary>Something went wrong. Where do I get help?</summary>
              <p>
                Open an issue on{" "}
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer">GitHub</a>.
                Include your wallet type, the network, and the transaction signature if you
                have one. Never share your seed phrase with anyone.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-title">SolReclaim</span>
            <p>
              Close unused Solana token accounts and get the locked rent back. You sign
              every transaction yourself.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#app">Reclaim SOL</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer">Report an issue</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
        <p className="footer-legal">
          SolReclaim is an independent tool. It is not affiliated with Solana, Phantom or
          Solflare. Closing accounts and burning tokens are irreversible blockchain actions.
          Use at your own risk. Nothing on this site is financial, legal or tax advice.
        </p>
      </footer>
    </div>
  );
}