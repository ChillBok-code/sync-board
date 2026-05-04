"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/shared/lib/supabase/server";

// 공통 표준 응답 인터페이스 [cite: 32]
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==========================================
// [Unit 2.1] 하위 할 일 생성 액션 [cite: 18]
// ==========================================
export async function createSubTask(
  taskId: string | number,
  title: string,
): Promise<ActionResponse> {
  try {
    if (!title.trim()) throw new Error("제목을 입력해주세요.");

    const supabase = await createClient();

    // 1. 세션 인증 확인 [cite: 20, 31]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "AUTH_REQUIRED" };

    // 2. 데이터 삽입 [cite: 20]
    const { error } = await supabase.from("sub_tasks").insert({
      task_id: taskId,
      title: title.trim(),
      is_completed: false,
    });

    if (error) throw error;

    revalidatePath("/"); // 성공 시 경로 갱신 [cite: 20, 35]
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "하위 할 일 생성에 실패했습니다.",
    };
  }
}

// ==========================================
// [Unit 2.2] 완료 상태 토글 액션 [cite: 21]
// ==========================================
export async function toggleSubTask(
  subTaskId: string,
  isCompleted: boolean,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // 세션 인증 [cite: 31]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "AUTH_REQUIRED" };

    // 상태 반전 업데이트 (상위 Task 상태 자동 변경 제외 - 수동 관리 원칙) [cite: 23]
    const { error } = await supabase
      .from("sub_tasks")
      .update({ is_completed: isCompleted })
      .eq("id", subTaskId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "상태 변경에 실패했습니다.",
    };
  }
}

// ==========================================
// [Unit 2.3] 하위 할 일 삭제 액션 [cite: 24]
// ==========================================
export async function deleteSubTask(
  subTaskId: string,
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "AUTH_REQUIRED" };

    // 이중 보안 검증: 삭제하려는 하위 할 일의 상위 Task가 현재 사용자의 소유인지 확인
    const { data: parentCheck, error: checkError } = await supabase
      .from("sub_tasks")
      .select("tasks!inner(user_id)")
      .eq("id", subTaskId)
      .single();

    // [수정] any 대신 명시적으로 객체 타입 { user_id: string }을 지정합니다.
    const taskData = parentCheck?.tasks as
      | { user_id: string }
      | null
      | undefined;

    if (checkError || !parentCheck || taskData?.user_id !== user.id) {
      return {
        success: false,
        error: "권한이 없거나 존재하지 않는 항목입니다.",
      };
    }

    // 항목 삭제
    const { error } = await supabase
      .from("sub_tasks")
      .delete()
      .eq("id", subTaskId);
    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
    };
  }
}

// ==========================================
// [Unit 2.4] 제목 수정 액션 [cite: 27]
// ==========================================
export async function updateSubTaskTitle(
  subTaskId: string,
  newTitle: string,
): Promise<ActionResponse> {
  try {
    // 빈 문자열 방지 유효성 검사 [cite: 29]
    if (!newTitle.trim())
      return { success: false, error: "수정할 제목을 입력해주세요." };

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "AUTH_REQUIRED" };

    // 텍스트 업데이트 [cite: 29]
    const { error } = await supabase
      .from("sub_tasks")
      .update({ title: newTitle.trim() })
      .eq("id", subTaskId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "제목 수정에 실패했습니다.",
    };
  }
}
