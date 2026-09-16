import type { Metadata } from "next";
import { PwaRegistration } from "@/pwa/pwa-registration";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexChain",
  description: "LexChain web portal for document verification and administration.",
  icons: {
    icon: "/lexchain/logo-lexchain.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <PwaRegistration />
      </body>
    </html>
  );
}
