import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function middleware(request: NextRequest) {
  // 1. 초기 응답 객체 생성
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Supabase 클라이언트 설정 (쿠키 동기화 로직 포함)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. [에러 방지] 유저 정보 안전하게 가져오기
  // 기존: const { data: { user } } = ... (data가 null이면 에러 발생)
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");

  // 4. 리다이렉트 로직
  // 로그인 안 한 유저가 보호된 페이지에 접근 시
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 이미 로그인한 유저가 로그인 페이지에 접근 시
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// 5. 실행 경로 설정 (정적 파일 제외)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
