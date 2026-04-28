// src/app/dashboard/page.tsx
"use client";

import DashboardStats from "./components/DashboardStats";
import DashboardChart from "./components/DashboardChart";
import RecentActivity from "./components/RecentActivity";
import { useTasks } from "@/shared/hooks/useTasks";
import { useDashboardData } from "@/shared/hooks/useDashboardData";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { tasks, loading } = useTasks(20);
  const { stats, totalTasks, recent } = useDashboardData(tasks);

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 font-bold animate-pulse">
          데이터 분석 중...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[#0f172a] text-white">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-indigo-400 uppercase tracking-tighter">
          할 일 한눈에
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          실시간 업무 현황 통계
        </p>
      </header>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardChart stats={stats} totalTasks={totalTasks} />
        <RecentActivity tasks={recent} />
      </div>
    </div>
  );
}
