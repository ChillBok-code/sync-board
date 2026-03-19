import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/app/components/Navigation"; // 1. 방금 만든 컴포넌트 불러오기

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SYNC BOARD | Task Manager", // 2. 타이틀 수정
  description: "Efficient task management with real-time sync",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}
      >
        {/* 3. 내비게이션 바를 최상단에 배치 */}
        <Navigation />

        {/* 4. 내용이 내비게이션 바에 가려지지 않도록 패딩 추가 */}
        <main className="pb-20 md:pb-0 md:pt-20">{children}</main>
      </body>
    </html>
  );
}
