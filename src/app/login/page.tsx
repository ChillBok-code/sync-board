"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/client"; // 만든 팩토리 함수
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  // 🚀 클라이언트 환경의 Supabase 인스턴스 생성
  const supabase = createClient();

  const handleAuth = async (action: "login" | "signup") => {
    setLoading(true);
    setErrorMsg("");

    try {
      if (action === "login") {
        // 1. 로그인 요청
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // 2. 성공 시 메인(칸반 보드)으로 이동 및 서버 컴포넌트 데이터 강제 갱신
        router.push("/");
        router.refresh();
      } else {
        // 3. 회원가입 요청
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("가입 성공! 이제 로그인 버튼을 눌러주세요.");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-sans p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 shadow-2xl rounded-2xl">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-black tracking-tighter text-indigo-400 uppercase text-center">
            SYNC BOARD LOGIN
          </CardTitle>
          <p className="text-center text-gray-400 text-sm mt-2">
            본인의 보드에 접근하려면 로그인하세요
          </p>
        </CardHeader>

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
              onKeyDown={(e) => e.key === "Enter" && handleAuth("login")}
            />
          </div>

          {errorMsg && (
            <div className="text-red-400 text-sm font-medium text-center bg-red-400/10 p-2 rounded-lg">
              {errorMsg}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
            onClick={() => handleAuth("login")}
            disabled={loading}
          >
            {loading ? "처리 중..." : "로그인"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
            onClick={() => handleAuth("signup")}
            disabled={loading}
          >
            회원가입
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
