// src/shared/hooks/useTasks.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import type { DashboardTask } from "@/app/dashboard/types";
import { useToast } from "@/shared/hooks/useToast";

export function useTasks(limit = 20) {
  const supabase = createClient();
  const { pushToast } = useToast();

  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("tasks")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (err) throw err;
      setTasks((data ?? []) as DashboardTask[]);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "데이터 로드 실패");
      pushToast({ title: "데이터 로드 실패", description: e.message ?? "" });
    } finally {
      setLoading(false);
    }
  }, [supabase, limit, pushToast]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  return { tasks, loading, error, reload: load, setTasks };
}
