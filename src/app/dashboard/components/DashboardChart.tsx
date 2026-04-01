import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Stat } from "../types";

const COLORS = ["#818CF8", "#FBBF24", "#10B981"];

interface DashboardChartProps {
  stats: Stat[];
  totalTasks: number;
}

export default function DashboardChart({
  stats,
  totalTasks,
}: DashboardChartProps) {
  return (
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
              paddingAngle={0}
              startAngle={90}
              endAngle={-270}
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
                <span className="text-slate-300 font-bold px-2">{value}</span>
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
  );
}
