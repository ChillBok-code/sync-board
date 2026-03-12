import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // 브라우저에서는 환경 변수가 자동으로 주입됩니다.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
