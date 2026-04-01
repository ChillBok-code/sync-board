import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DashboardTask } from "../types";

interface RecentActivityProps {
  tasks: DashboardTask[];
}

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

export default function RecentActivity({ tasks }: RecentActivityProps) {
  return (
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
          {tasks.length > 0 ? (
            tasks.map((task) => (
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
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap shrink-0 ${getStatusColor(task.status)}`}
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
  );
}
