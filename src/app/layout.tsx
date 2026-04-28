// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation";
import { ToastProvider } from "@/shared/ui/toast"; // 추가

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SYNC BOARD | Task Manager",
  description: "Efficient task management with real-time sync",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-900 text-white min-h-screen selection:bg-indigo-500/30`}
      >
        <ToastProvider>
          <Navigation />
          <main
            id="scroll-container"
            className="min-h-screen pb-24 md:pb-0 md:pt-20 transition-all duration-300"
          >
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
