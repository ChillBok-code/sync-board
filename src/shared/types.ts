export interface SubTask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  status: "todo" | "doing" | "done";
  order: number;
  user_id: string;
  created_at: string;
  content?: string | null;
  due_date?: string | null;
  sub_tasks?: SubTask[];
}
