"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react"; // 로딩 아이콘

const COLORS = ["#818CF8", "#FBBF24", "#10B981"];

interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{ name: string; value: number }[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  const supabase = createClient();

  // 데이터를 불러오는 로직을 useCallback으로 분리 (재사용 및 Realtime용)
  const loadData = useCallback(async () => {
    const [statsRes, recentRes] = await Promise.all([
      supabase.from("tasks").select("status"),
      supabase
        .from("tasks")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (statsRes.error || recentRes.error) {
      console.error("데이터 로드 실패");
      return;
    }

    // 데이터 가공
    const rawData = statsRes.data || [];
    const counts: Record<string, number> = { todo: 0, doing: 0, done: 0 };

    rawData.forEach((task) => {
      if (counts[task.status] !== undefined) {
        counts[task.status]++;
      }
    });

    setTotalTasks(rawData.length);
    setStats([
      { name: "할 일", value: counts.todo },
      { name: "진행 중", value: counts.doing },
      { name: "완료", value: counts.done },
    ]);
    setRecentTasks((recentRes.data as Task[]) || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    // 해결 방법: 비동기 함수를 생성하고 즉시 호출하여
    // Effect 본문과의 동기적 실행 연결고리를 끊어줍니다.
    const initialize = async () => {
      await loadData();
    };

    initialize();

    // 대시보드 실시간 업데이트 활성화
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

  const getStatusColor = (status: string) => {
    const colors = {
      todo: "bg-indigo-500/20 text-indigo-400",
      doing: "bg-amber-500/20 text-amber-400",
      done: "bg-emerald-500/20 text-emerald-400",
    };
    return (
      colors[status as keyof typeof colors] || "bg-gray-500/20 text-gray-400"
    );
  };

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
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-indigo-400 uppercase tracking-tighter">
            할 일 한눈에
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            실시간 업무 현황 통계
          </p>
        </div>
      </header>

      {/* 상단 요약 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((item, index) => (
          <div
            key={item.name}
            className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl shadow-xl transition-transform hover:scale-[1.02]"
          >
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
              {item.name}
            </p>
            <div className="flex items-baseline gap-2">
              <h3
                className="text-4xl font-black"
                style={{ color: COLORS[index] }}
              >
                {item.value}
              </h3>
              <span className="text-gray-500 font-bold text-sm">개</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 도넛 차트 카드 */}
        <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl border-none">
          <CardHeader>
            <CardTitle className="text-slate-100 text-2xl font-black">
              업무 분포도
            </CardTitle>
          </CardHeader>
          <CardContent className="h-100 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-slate-300 font-bold px-2">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">
                Total
              </p>
              <p className="text-5xl font-black text-white leading-none">
                {totalTasks}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 최근 리스트 카드 */}
        <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl border-none">
          <CardHeader>
            <CardTitle className="text-slate-100 text-2xl font-black flex justify-between items-center">
              최근 활동
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                Recent 20
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-gray-900/40 border border-gray-700/20 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-200 font-bold group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(task.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(task.status)}`}
                    >
                      {task.status === "todo"
                        ? "할 일"
                        : task.status === "doing"
                          ? "진행 중"
                          : "완료"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                  <p className="font-bold">데이터가 존재하지 않습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
