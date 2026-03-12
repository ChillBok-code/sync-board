import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 🚀 서버용 Supabase 클라이언트를 생성하는 팩토리 함수
 * @description 반드시 await를 붙여서 호출해야 합니다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  // ⚡ 여기서 'createServerClient'를 직접 실행합니다.
  // 이 호출문이 있어야 상단의 'import { createServerClient }' 경고가 사라집니다.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // 서버 컴포넌트 환경에서는 쿠키 세팅 실패를 묵인합니다.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // 서버 컴포넌트 환경에서는 쿠키 삭제 실패를 묵인합니다.
          }
        },
      },
    },
  );
}
