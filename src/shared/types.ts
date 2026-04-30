export interface Task {
  id: number;
  title: string;
  status: "todo" | "doing" | "done";
  order: number;
  user_id: string;
  created_at: string;
  content?: string | null; // [Task G] 메모 본문
  due_date?: string | null; // [Task H] 마감 기한
}
