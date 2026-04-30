"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatusCount } from "@/app/action";

const COLORS = ["#818cf8", "#fbbf24", "#34d399"];
const STATUS_MAP: Record<string, string> = {
  todo: "할 일",
  doing: "진행 중",
  done: "완료",
};

export default function StatusChart({
  statusCounts,
}: {
  statusCounts: StatusCount[];
}) {
  const data = statusCounts.map((s) => ({
    name: STATUS_MAP[s.status] || s.status,
    value: s.count,
  }));

  return (
    <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl border-none shadow-2xl">
      <CardHeader>
        <CardTitle className="text-slate-100 text-2xl font-black">
          상태 분포
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
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
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
