// src/shared/hooks/useDashboardData.tsx
"use client";

import { useMemo } from "react";
import type { Stat, DashboardTask } from "@/app/dashboard/types";

export function useDashboardData(tasks: DashboardTask[]) {
  const totalTasks = tasks.length;

  const stats: Stat[] = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, doing: 0, done: 0 };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return [
      { name: "할 일", value: counts.todo },
      { name: "진행 중", value: counts.doing },
      { name: "완료", value: counts.done },
    ];
  }, [tasks]);

  const recent = useMemo(() => tasks.slice(0, 20), [tasks]);

  return { stats, totalTasks, recent };
}
