"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Stat, DashboardTask } from "./types";
import DashboardStats from "./components/DashboardStats";
import DashboardChart from "./components/DashboardChart";
import RecentActivity from "./components/RecentActivity";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [recentTasks, setRecentTasks] = useState<DashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const [statsRes, recentRes] = await Promise.all([
      supabase.from("tasks").select("status"),
      supabase
        .from("tasks")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (!statsRes.error && !recentRes.error && statsRes.data) {
      const counts: Record<string, number> = { todo: 0, doing: 0, done: 0 };
      statsRes.data.forEach((task: { status: string }) => {
        if (counts[task.status] !== undefined) counts[task.status]++;
      });

      setTotalTasks(statsRes.data.length);
      setStats([
        { name: "할 일", value: counts.todo },
        { name: "진행 중", value: counts.doing },
        { name: "완료", value: counts.done },
      ]);
      setRecentTasks(recentRes.data as DashboardTask[]);
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const initializeDashboard = async () => {
      await loadData();
    };
    initializeDashboard();
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

  if (isLoading) {
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
        <RecentActivity tasks={recentTasks} />
      </div>
    </div>
  );
}
