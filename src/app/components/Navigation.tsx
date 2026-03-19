"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-800 bg-gray-900/80 px-6 py-3 backdrop-blur-md transition-all duration-300 md:bottom-auto md:top-0 md:border-b md:border-t-0 md:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* 로고: PC에서만 노출 */}
        <div className="hidden md:block text-xl font-bold text-indigo-500 tracking-tighter">
          SYNC BOARD
        </div>

        {/* 메뉴 링크 영역 */}
        <div className="flex w-full md:w-auto justify-around md:justify-end gap-10">
          <Link
            href="/"
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
              isActive("/")
                ? "text-indigo-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="text-xl md:text-base">📋</span>
            <span className="text-[10px] md:text-sm uppercase tracking-wider">
              홈
            </span>
          </Link>

          <Link
            href="/dashboard"
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
              isActive("/dashboard")
                ? "text-indigo-400 font-bold"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="text-xl md:text-base">📊</span>
            <span className="text-[10px] md:text-sm uppercase tracking-wider">
              통계
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
