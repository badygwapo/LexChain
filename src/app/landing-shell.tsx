"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

export function LandingShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  return (
    <div className="landing" data-theme={dark ? "dark" : "light"}>
      <a className="landing-skip" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <nav className="landing-container landing-nav" aria-label="Main navigation">
          <Link className="landing-brand" href="/" aria-label="LexChain home">
            <Image alt="" height={40} src="/lexchain/logo-lexchain.svg" width={40} />
            <span>Lex<span className="landing-accent">Chain</span></span>
          </Link>
          <div className="landing-nav-actions">
            <Link className="landing-nav-link" href="/download">Download</Link>
            <button
              type="button"
              className="landing-theme-toggle"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDark((value) => !value)}
            >
              {dark ? <LightModeOutlinedIcon aria-hidden="true" /> : <DarkModeOutlinedIcon aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
