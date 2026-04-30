export interface Stat {
  name: string;
  value: number;
}

export interface DashboardTask {
  id: number;
  title: string;
  status: "todo" | "doing" | "done";
  created_at: string;
  content?: string | null;
  due_date?: string | null;
}
