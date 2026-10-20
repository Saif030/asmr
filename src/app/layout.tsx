import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Khatmal Coaching",
    template: "%s · Khatmal Coaching",
  },
  description:
    "A private study-sharing hub for a small group of friends: books, PYQs, question banks, notes and a group chat.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
