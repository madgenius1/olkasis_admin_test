import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Olkasis Admin Console",
    template: "%s — Olkasis Admin",
  },
  description:
    "Olkasis Admin Console — manage users, compliance, trading, and operations for the Olkasis app investment platform.",
  robots: { index: false, follow: false }, // Admin tool — no indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}