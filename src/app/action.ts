"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 공통 유저 인증 확인 함수
 * 내부에서만 사용하며, 인증 실패 시 에러를 던집니다.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return { supabase, user };
}

/**
 * 신규 할 일 생성 액션
 */
export async function createTask(title: string) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          user_id: user.id,
          status: "todo",
          order: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/");
    return { success: true, data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 에러 발생",
    };
  }
}

/**
 * 태스크 순서 및 상태 일괄 업데이트 (드래그 앤 드롭용)
 * Unexpected any 방지를 위해 정확한 타입을 지정합니다.
 */
interface UpdateTaskParams {
  id: number;
  status: string;
  order: number;
}

export async function updateTasksOrder(updatedTasks: UpdateTaskParams[]) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // 보안 강화: 업데이트할 데이터에 서버에서 확인한 user_id를 강제로 매핑
    const payload = updatedTasks.map((task) => ({
      ...task,
      user_id: user.id,
    }));

    const { error } = await supabase
      .from("tasks")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    revalidatePath("/"); // 메인 페이지와 대시보드 데이터 갱신
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "순서 업데이트 실패",
    };
  }
}
