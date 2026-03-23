"use client";

import { useEffect, useState } from "react";
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

const COLORS = ["#818CF8", "#FBBF24", "#10B981"];

// Task 인터페이스 정의 (타입 안정성 확보)
interface Task {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{ name: string; value: number }[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]); // 최근 할 일 상태 추가
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // 통계용 전체 데이터와 최근 작업 20개를 병렬로 가져옵니다
      const [statsRes, recentRes] = await Promise.all([
        supabase.from("tasks").select("status"),
        supabase
          .from("tasks")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false }) // 최신순 정렬
          .limit(20), // 20개만 제한
      ]);

      if (statsRes.error || recentRes.error) return;

      if (isMounted) {
        // 통계 계산
        const counts = statsRes.data.reduce<Record<string, number>>(
          (acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          },
          {},
        );

        setTotalTasks(statsRes.data.length);
        setStats([
          { name: "할 일", value: counts.todo || 0 },
          { name: "진행 중", value: counts.doing || 0 },
          { name: "완료", value: counts.done || 0 },
        ]);

        // 최근 작업 업데이트
        setRecentTasks(recentRes.data as Task[]);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // 상태별 뱃지 색상 매핑
  const getStatusColor = (status: string) => {
    if (status === "todo") return "bg-indigo-500/20 text-indigo-400";
    if (status === "doing") return "bg-amber-500/20 text-amber-400";
    return "bg-emerald-500/20 text-emerald-400";
  };

  return (
    <div className="p-8 min-h-screen bg-[#0f172a] text-white">
      <h1 className="text-4xl font-black mb-10 text-indigo-400 uppercase tracking-tighter">
        할 일 한눈에
      </h1>

      {/* 요약 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((item, index) => (
          <div
            key={item.name}
            className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl shadow-xl"
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
        {/* 업무 분포도 (도넛 차트) */}
        <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
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
                  {stats.map((entry, index) => (
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

        {/* 최근 등록된 할 일 리스트 */}
        <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader>
            <CardTitle className="text-slate-100 text-2xl font-black flex justify-between items-center">
              최근 등록된 할 일
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest text-right">
                최근 등록순
              </span>
            </CardTitle>
          </CardHeader>
          {/* UI 수정 사항 적용 */}
          <CardContent className="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-gray-900/50 border border-gray-700/30 transition-all hover:border-indigo-500/50 hover:bg-gray-900/80"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-200 font-bold group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                        {new Date(task.created_at).toLocaleDateString()} 에
                        추가됨
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(task.status)}`}
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
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <p className="font-bold">등록된 할 일이 없습니다.</p>
                  <p className="text-sm">
                    보드에서 새로운 작업을 추가해 보세요!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
