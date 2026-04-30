import { getDashboardData } from "@/app/action"; // [FIX] 경로를 @/app/action으로 수정하여 TS2307 해결
import DashboardView from "./components/DashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 서버 계층에서 데이터 페칭
  const data = await getDashboardData();

  return (
    <div className="p-8 min-h-screen bg-[#0f172a] text-white">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-indigo-400 uppercase tracking-tighter">
          할 일 한눈에
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          실시간 데이터 분석 시스템 v2.0
        </p>
      </header>

      {/* 뷰 컴포넌트에 서버 데이터 주입 */}
      <DashboardView
        initialTasks={data.recentTasks}
        statusCounts={data.statusCounts}
        dailyTrend={data.dailyTrend}
      />
    </div>
  );
}
