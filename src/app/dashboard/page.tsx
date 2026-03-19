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

// 차트에 사용할 색상 팔레트 (Tailwind 색상 기반)
const COLORS = ["#6366f1", "#fbbf24", "#22c55e"]; // Indigo, Amber, Green

export default function DashboardPage() {
  const [stats, setStats] = useState<{ name: string; value: number }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // 1. 컴포넌트 언마운트 시 메모리 누수 방지를 위한 플래그
    let isMounted = true;

    const loadData = async () => {
      const { data, error } = await supabase.from("tasks").select("status");

      if (error) {
        console.error("Data fetch error:", error.message);
        return;
      }

      if (data && isMounted) {
        const counts = data.reduce<Record<string, number>>((acc, task) => {
          const status = task.status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const chartData = [
          { name: "할 일", value: counts.todo || 0 },
          { name: "진행 중", value: counts.doing || 0 },
          { name: "완료", value: counts.done || 0 },
        ];

        setStats(chartData);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [supabase]); // 이제 useCallback 없이도 supabase만 의존성에 넣으면 됩니다.

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-black mb-8 text-indigo-400 uppercase tracking-tighter">
        할 일 한눈에
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 현황 카드 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-slate-200 text-xl font-bold mb-3">
              할 일 상태
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
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
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 여기에 추가적인 통계 카드나 목록을 넣을 예정입니다 */}
      </div>
    </div>
  );
}
