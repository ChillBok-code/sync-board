// src/app/dashboard/types.ts
export interface Stat {
  name: string;
  value: number;
}

export interface DashboardTask {
  id: number; // Supabase 기본 PK가 number 라고 가정하고 통일
  title: string;
  status: "todo" | "doing" | "done";
  created_at: string;
}
