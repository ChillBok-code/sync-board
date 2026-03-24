"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/ui/button";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 사용자 세션 정보 가져오기 (안전한 방식)
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      // data가 null일 경우를 대비해 옵셔널 체이닝 사용
      if (data?.user) {
        setUserEmail(data.user.email ?? "User");
      }
    };
    checkUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { label: "홈", href: "/", icon: ClipboardList },
    { label: "통계", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-800 bg-gray-900/80 px-6 py-3 backdrop-blur-md transition-all duration-300 md:bottom-auto md:top-0 md:border-b md:border-t-0 md:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* 로고 영역 */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className="text-xl font-black text-indigo-500 tracking-tighter hover:opacity-80 transition-opacity"
          >
            SYNC BOARD
          </Link>
          {userEmail && (
            <span className="text-xs text-gray-500 font-medium border-l border-gray-700 pl-4">
              {userEmail}
            </span>
          )}
        </div>

        {/* 메뉴 링크 및 로그아웃 영역 */}
        <div className="flex w-full md:w-auto justify-around md:justify-end items-center gap-2 md:gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group flex flex-col md:flex-row items-center gap-1.5 md:gap-2.5 px-4 py-1 transition-all",
                  active
                    ? "text-indigo-400 font-bold"
                    : "text-gray-500 hover:text-gray-200",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 md:w-5 md:h-5 transition-transform group-active:scale-90",
                    active ? "animate-in fade-in zoom-in duration-300" : "",
                  )}
                />
                <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">
                  {item.label}
                </span>

                {/* 하단 활성화 라인 (relative 부모 기준) */}
                {active && (
                  <span className="hidden md:block absolute -bottom-4.75 left-0 right-0 h-0.5 bg-indigo-500 rounded-full animate-in fade-in slide-in-from-bottom-1" />
                )}
              </Link>
            );
          })}

          {/* 로그아웃 버튼: 유저 정보가 있을 때만 노출 */}
          {userEmail && (
            <Button
              variant="ghost" // Shadcn UI 버튼 스타일 적용
              onClick={handleSignOut}
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-4 py-1 text-gray-500 hover:text-red-400 transition-colors h-auto"
            >
              <LogOut className="w-6 h-6 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm font-medium uppercase tracking-widest">
                로그아웃
              </span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
