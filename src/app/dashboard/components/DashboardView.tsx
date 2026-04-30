"use client";

import { useOptimistic, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/client";
import { DashboardTask } from "../types";
// [해결 1] action.ts의 정확한 절대 경로로 수정
import { addAction, StatusCount, DailyTrend } from "@/app/action";
import AddTaskForm from "./AddTaskForm";
import RecentActivity from "./RecentActivity";
import StatusChart from "./StatusChart";
import TrendChart from "./TrendChart";
import DashboardStats from "./DashboardStats";

interface DashboardViewProps {
  initialTasks: DashboardTask[];
  statusCounts: StatusCount[];
  dailyTrend: DailyTrend[];
}

export default function DashboardView({
  initialTasks,
  statusCounts,
  dailyTrend,
}: DashboardViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state, newTask: DashboardTask) => [newTask, ...state],
  );

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const handleAddTask = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const newTask: DashboardTask = {
      id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
      title,
      status: "todo",
      created_at: new Date().toISOString(),
      content: null,
      due_date: null,
    };

    startTransition(async () => {
      addOptimisticTask(newTask);
      try {
        const result = await addAction(formData);
        if (!result.success) throw new Error(result.error);
      } catch (_err) {
        // [해결 2] ESLint 에러 해결 (_err 사용)
        console.error("Add Task Error:", _err);
        alert("데이터 저장 실패. 이전 상태로 복구합니다.");
        router.refresh();
      }
    });
  };

  const stats = statusCounts.map((s) => ({
    name:
      s.status === "todo" ? "할 일" : s.status === "doing" ? "진행 중" : "완료",
    value: s.count,
  }));

  return (
    <div className="space-y-8">
      <AddTaskForm onAdd={handleAddTask} isPending={isPending} />
      <DashboardStats stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StatusChart statusCounts={statusCounts} />
        <TrendChart dailyTrend={dailyTrend} />
        <div className="lg:col-span-2">
          <RecentActivity tasks={optimisticTasks} />
        </div>
      </div>
    </div>
  );
}
