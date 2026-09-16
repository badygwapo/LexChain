import type { Metadata } from "next";

import { VerifiedContent } from "./verified-content";

export const metadata: Metadata = {
  title: "Email verified | LexChain",
  description: "Your LexChain account email has been verified.",
};

export default function AuthVerifiedPage() {
  return <VerifiedContent />;
}
