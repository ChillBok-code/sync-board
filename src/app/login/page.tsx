"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";

export default function LoginPage() {
  // [추가됨] 뷰 전환을 위한 상태 (false면 로그인, true면 회원가입)
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // 🚀 회원가입 전용

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 시 새로고침 방지

    // 1. 공통 유효성 검사
    if (!email || !password) {
      setErrorMsg("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 2. 회원가입 전용 유효성 검사 (비밀번호 일치 여부)
    if (isSignUp && password !== passwordConfirm) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (!isSignUp) {
        // [로그인 로직]
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/");
        router.refresh();
      } else {
        // [회원가입 로직]
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        alert("가입 성공! 이제 로그인해주세요.");
        setIsSignUp(false); // 가입 성공 시 자동으로 로그인 화면으로 전환
        setPasswordConfirm(""); // 비밀번호 확인 칸 초기화
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 모드 전환 핸들러 (입력된 값들과 에러 메시지를 초기화)
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-sans p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-2xl rounded-2xl transition-all duration-300">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-black tracking-tighter text-indigo-400 uppercase text-center">
            {isSignUp ? "JOIN SYNC BOARD" : "SYNC BOARD LOGIN"}
          </CardTitle>
          <p className="text-center text-gray-400 text-sm mt-2">
            {isSignUp
              ? "새로운 계정을 생성하여 보드를 시작하세요"
              : "본인의 보드에 접근하려면 로그인하세요"}
          </p>
        </CardHeader>

        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email (ex: chillbok@test.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password (최소 6자리)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus-visible:ring-indigo-500"
              />
            </div>

            {/* 회원가입 모드일 때만 나타나는 비밀번호 확인 칸 */}
            {isSignUp && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white focus-visible:ring-indigo-500"
                />
              </div>
            )}

            {errorMsg && (
              <div className="text-red-400 text-sm font-medium text-center bg-red-400/10 p-2 rounded-lg">
                {errorMsg}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
              disabled={loading}
            >
              {loading ? "처리 중..." : isSignUp ? "가입 완료" : "로그인"}
            </Button>

            {/* 모드 전환 텍스트 버튼 */}
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-gray-400 hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
            >
              {isSignUp
                ? "이미 계정이 있으신가요? 로그인하기"
                : "계정이 없으신가요? 회원가입하기"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
