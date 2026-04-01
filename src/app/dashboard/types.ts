// src/app/dashboard/types.ts

export interface Stat {
  name: string;
  value: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  created_at: string;
}
