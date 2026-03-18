"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 신규 할 일 생성 액션
 */
export async function createTask(title: string) {
  // 1. 서버용 클라이언트 호출 (쿠키 기반 세션 확인)
  const supabase = await createClient();

  // 2. 현재 로그인한 유저 정보 추출
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // 3. DB Insert (user_id를 서버에서 직접 주입)
  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        title,
        user_id: user.id, // 핵심: 유저가 보내는 게 아니라 서버가 검증한 ID
        status: "todo",
        order: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // 4. 페이지 데이터 갱신
  revalidatePath("/");

  return { success: true, data };
}
