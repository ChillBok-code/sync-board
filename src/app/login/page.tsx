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
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setErrorMsg("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("비밀번호는 최소 6자리 이상이어야 합니다.");
      return;
    }
    if (isSignUp && password !== passwordConfirm) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      if (!isSignUp) {
        // [로그인 로직]
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("이메일 또는 비밀번호가 잘못되었습니다.");
          }
          throw error;
        }

        // [핵심 수정] data?.user를 사용하여 안전하게 확인
        if (data?.user) {
          router.push("/");
          router.refresh();
        }
      } else {
        // [회원가입 로직]
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        alert("회원가입 성공! 이제 로그인해주세요.");
        setIsSignUp(false);
        setPasswordConfirm("");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "인증 오류가 발생했습니다.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-sans p-4 selection:bg-indigo-500/30">
      <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur-xl border-gray-700/50 shadow-2xl rounded-3xl transition-all duration-500">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-2">
            {isSignUp ? (
              <UserPlus className="text-indigo-400" />
            ) : (
              <LogIn className="text-indigo-400" />
            )}
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-indigo-400 uppercase">
            {isSignUp ? "Join Sync Board" : "Sync Board Login"}
          </CardTitle>
          <p className="text-gray-400 text-sm">
            {isSignUp ? "새로운 계정을 생성하세요" : "계정에 로그인하세요"}
          </p>
        </CardHeader>

        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4 px-8">
            <Input
              type="email"
              disabled={loading}
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white rounded-xl"
            />
            <Input
              type="password"
              disabled={loading}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white rounded-xl"
            />
            {isSignUp && (
              <Input
                type="password"
                disabled={loading}
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-white rounded-xl animate-in fade-in slide-in-from-top-2"
              />
            )}
            {errorMsg && (
              <div className="text-red-400 text-xs text-center bg-red-400/10 py-2 rounded-xl border border-red-400/20">
                {errorMsg}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4 pb-10 px-8">
            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                "가입하기"
              ) : (
                "로그인하기"
              )}
            </Button>
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              {isSignUp
                ? "이미 계정이 있으신가요? 로그인"
                : "계정이 없으신가요? 회원가입"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
