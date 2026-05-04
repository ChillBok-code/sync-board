"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DashboardTask } from "../types";

export default function RecentActivity({ tasks }: { tasks: DashboardTask[] }) {
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

  return (
    <Card className="bg-gray-800/40 border-gray-700/50 rounded-3xl shadow-2xl border-none">
      <CardHeader>
        <CardTitle className="text-slate-100 text-2xl font-black flex justify-between items-center">
          최근 활동{" "}
          <span className="text-[10px] font-medium text-slate-500">
            Recent 20
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-100 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex flex-col gap-2 p-4 rounded-2xl bg-gray-900/40 border border-gray-700/20 hover:border-indigo-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {task.title}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(task.status)}`}
                >
                  {task.status}
                </span>
              </div>
              {task.content && (
                <p className="text-[11px] text-gray-500 line-clamp-1 italic">
                  {task.content}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                {/* [수정 완료] 여기에 suppressHydrationWarning 속성을 추가했습니다. */}
                <span
                  suppressHydrationWarning
                  className="text-[10px] text-slate-600"
                >
                  {new Date(task.created_at).toLocaleString()}
                </span>
                {task.due_date && (
                  <span className="text-[10px] text-rose-400 font-medium">
                    Due:{" "}
                    {new Intl.DateTimeFormat("ko-KR", {
                      dateStyle: "short",
                    }).format(new Date(task.due_date))}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
