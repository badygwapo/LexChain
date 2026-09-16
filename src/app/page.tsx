import Image from "next/image";
import Link from "next/link";
import { LandingShell } from "./landing-shell";
import "./landing.css";

const problems = [
  ["Scattered storage", "Legal files sit across paper folders, email threads, shared drives, and manual logs."],
  ["Slow retrieval", "Teams lose time because records are named, tagged, or stored inconsistently."],
  ["Weak integrity checks", "Users cannot quickly prove that a scanned copy still matches the original file."],
  ["Unclear access", "Sensitive documents are often shared without controlled visibility."],
];

const features = [
  ["Organize your records", "Secure upload and organized document storage."],
  ["Read beyond the scan", "OCR and NLP processing for scanned legal files."],
  ["Understand the essentials", "AI summaries for long legal documents."],
  ["Find the details that matter", "Key party, date, obligation, and clause detection."],
  ["Ask your documents", "Ask-document search across authorized records."],
  ["Check document integrity", "Blockchain-backed hash verification."],
];

const steps = [
  ["Upload", "Bring your legal files into one organized workspace."],
  ["Extract", "Make scanned content searchable with OCR and NLP."],
  ["Summarize", "Review the key information in long documents."],
  ["Protect", "Control who can access sensitive records."],
  ["Verify", "Check a file against its recorded hash."],
];

export default function Home() {
  return (
    <LandingShell>
      <main id="main-content">
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <h1>Legal documents.<br />Managed with confidence.</h1>
              <p>Find, understand, share, and verify legal documents in one secure workspace.</p>
              <div className="landing-actions">
                <Link className="landing-button" href="/login">Sign In</Link>
                <a className="landing-text-link" href="#workflow">See how it works</a>
              </div>
            </div>
            <Image
              alt="LexChain mobile document dashboard"
              className="landing-hero-image"
              height={1080}
              width={864}
              sizes="(min-width: 1024px) 420px, (min-width: 768px) 340px, 280px"
              priority
              src="/lexchain/hero-lexchain.png"
            />
          </div>
        </section>

        <section className="landing-intro landing-container" aria-label="Who LexChain is for">
          <p>For document issuers, law offices, organizations, and authorized users.</p>
          <span>Secure storage. Controlled access. Verifiable integrity.</span>
        </section>

        <section className="landing-section landing-container">
          <div className="landing-section-heading">
            <h2>Less searching.<br />More certainty.</h2>
            <p>LexChain replaces scattered records with a controlled document system built for search, access, and trust.</p>
          </div>
          <div className="landing-problems">
            {problems.map(([title, copy]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-soft">
          <div className="landing-section landing-container">
            <div className="landing-section-heading">
              <h2>Built for daily document work.</h2>
              <p>From the first upload to the final integrity check, keep the tools you need together.</p>
            </div>
            <div className="landing-features">
              {features.map(([title, copy]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-container" id="workflow">
          <div className="landing-section-heading">
            <h2>One controlled flow.<br />From upload to verification.</h2>
            <p>A simple experience for your team, with extraction, search, access rules, and integrity checks working together.</p>
          </div>
          <ol className="landing-workflow">
            {steps.map(([title, copy]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-soft">
          <div className="landing-section landing-container landing-verification">
            <div>
              <h2>Know if a file still matches the original.</h2>
              <p>LexChain creates a unique file hash and checks it against a blockchain-backed record. If a file changes, the hash changes too.</p>
              <ul>
                <li>Verify without exposing private document content on-chain.</li>
                <li>Confirm integrity before accepting or sharing a copy.</li>
                <li>Give issuers and users a reliable integrity check.</li>
              </ul>
            </div>
            <Image
              alt="LexChain verification interface"
              className="landing-verification-image"
              height={1080}
              width={1080}
              sizes="(min-width: 1024px) 480px, (min-width: 768px) 40vw, 90vw"
              src="/lexchain/hero-two-mobile-lexchain.png"
            />
          </div>
        </section>

        <section className="landing-section landing-container landing-search">
          <h2>Your questions.<br />Your authorized records.</h2>
          <div>
            <p>Search document content or ask focused questions across documents you are allowed to access. LexChain answers from authorized records only.</p>
            <blockquote>
              <p>“What are the payment obligations in this contract?”</p>
              <footer>An example of a question you can ask your document.</footer>
            </blockquote>
          </div>
        </section>

        <section className="landing-soft" aria-labelledby="landing-download-heading">
          <div className="landing-container landing-download">
            <div>
              <h2 id="landing-download-heading">Keep your document work connected.</h2>
              <p>Explore LexChain download options for your device.</p>
            </div>
            <div className="landing-badges">
              <Link className="landing-store-badge" href="/download" aria-label="Explore App Store download options">
                <Image alt="App Store" height={40} width={120} src="/lexchain/app-store-badge.png" />
              </Link>
              <Link className="landing-store-badge landing-google-badge" href="/download" aria-label="Explore Google Play download options">
                <Image alt="Google Play" height={1500} width={2000} src="/lexchain/google-play-badge.png" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-container landing-footer">
        <p>© {new Date().getFullYear()} LexChain.</p>
        <nav aria-label="Legal navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p>Blockchain-powered document verification.</p>
      </footer>
    </LandingShell>
  );
}
