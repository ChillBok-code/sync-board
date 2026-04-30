"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DailyTrend } from "@/app/action";

export default function TrendChart({
  dailyTrend,
}: {
  dailyTrend: DailyTrend[];
}) {
  const isSinglePoint = dailyTrend.filter((t) => t.count > 0).length === 1;
  return (
    <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl border-none shadow-2xl">
      <CardHeader>
        <CardTitle className="text-slate-100 text-2xl font-black">
          주간 생성 추이
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dailyTrend}
            margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#334155"
              opacity={0.2}
            />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 15, right: 15 }}
            />
            <YAxis
              width={40}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}건`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Line
              type={isSinglePoint ? "step" : "linear"}
              dataKey="count"
              stroke="#818cf8"
              strokeWidth={3}
              dot={{ r: 4, fill: "#818cf8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
