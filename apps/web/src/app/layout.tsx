import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Note: uses the system font stack (see globals.css --font-sans) instead of next/font/google
// so the app builds without outbound network access during build.

export const metadata: Metadata = {
  title: "IntelliMatch AI — Understand your potential. Match your future.",
  description: "Enterprise AI + ML career intelligence platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
