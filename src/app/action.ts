"use server";

// [긴급 수정] 스크롤 점프의 원인이 되는 revalidatePath는 더 이상 사용하지 않으므로 제거(또는 주석 처리)합니다.
// import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";
import type { DashboardTask } from "@/app/dashboard/types";

export interface StatusCount {
  status: "todo" | "doing" | "done";
  count: number;
}
export interface DailyTrend {
  date: string;
  count: number;
}

// 대시보드 전체 데이터 조회
export async function getDashboardData() {
  const supabase = await createClient();
  const [statusRes, trendRes, recentRes] = await Promise.all([
    supabase.rpc("get_status_counts"),
    supabase.rpc("get_daily_trend", { days_limit: 7 }),
    supabase
      .from("tasks")
      .select("id, title, status, created_at, content, due_date, sub_tasks(*)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (statusRes.error || trendRes.error || recentRes.error) {
    throw new Error("DB_ERROR");
  }

  return {
    statusCounts: (statusRes.data || []) as StatusCount[],
    dailyTrend: (trendRes.data || []).map(
      (row: { date_iso: string; count: string | number }) => ({
        date: row.date_iso,
        count: Number(row.count),
      }),
    ),
    recentTasks: (recentRes.data || []) as DashboardTask[],
  };
}

// 할 일 생성 (FormData 매핑)
export async function addAction(formData: FormData) {
  const title = formData.get("title") as string;
  const due_date = formData.get("due_date") as string | null;
  return createTask(title, due_date);
}

// 공통 할 일 생성 로직
export async function createTask(title: string, dueDate?: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "AUTH_REQUIRED" };

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      status: "todo",
      user_id: user.id,
      order: 0,
      due_date: dueDate || null,
    })
    .select()
    .single();

  if (error) return { success: false, error: "INSERT_FAILED" };

  // [Unit 4.1] 전체 페이지 새로고침을 유발하는 코드 제거
  // revalidatePath("/");
  // revalidatePath("/dashboard");

  return { success: true, data };
}

// 순서 및 상태 업데이트 (D&D용)
export async function updateTasksOrder(
  updatedTasks: { id: number; status: string; order: number }[],
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인 필요");

    const payload = updatedTasks.map((task) => ({ ...task, user_id: user.id }));
    const { error } = await supabase
      .from("tasks")
      .upsert(payload, { onConflict: "id" });
    if (error) throw error;

    // [Unit 4.1] 전체 페이지 새로고침을 유발하는 코드 제거
    // revalidatePath("/");
    // revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "업데이트 중 오류가 발생했습니다.",
    };
  }
}
