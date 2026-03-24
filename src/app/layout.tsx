import type { Metadata, Viewport } from "next"; // Viewport 추가
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // 폰트 로딩 최적화
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

// 모바일 브라우저의 상단 바 색상 등을 제어하기 위한 viewport 설정
export const viewport: Viewport = {
  themeColor: "#0f172a", // bg-gray-900 계열 색상
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
        <Navigation />
        <main
          id="scroll-container"
          className="min-h-screen pb-24 md:pb-0 md:pt-20 transition-all duration-300"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
