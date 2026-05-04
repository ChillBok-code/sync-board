// [신규] SubTask 인터페이스 정의
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
export interface SubTask {
  id: string;
  task_id: string; // 또는 DB의 tasks.id 타입에 맞춰 number로 유연하게 조정 가능
  title: string;
  is_completed: boolean;
  created_at: string;
}

// [확장] 기존 Task 인터페이스 업데이트
export interface Task {
  id: number;
  title: string;
  status: "todo" | "doing" | "done";
  order: number;
  user_id: string;
  created_at: string;
  content?: string | null;
  due_date?: string | null;

  // [추가] 1:N 관계의 하위 할 일 리스트 바인딩
  sub_tasks?: SubTask[];
}
