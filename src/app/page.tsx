"use client";

import { createTask, updateTasksOrder } from "@/app/action";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import TaskColumn from "@/app/components/TaskColumn";
import { SubTask } from "@/shared/types";

interface Task {
  id: number;
  title: string;
  content: string | null;
  status: string;
  order: number;
  due_date?: string | null;
  sub_tasks?: SubTask[];
}

const COLUMNS = [
  { status: "todo", title: "To Do" },
  { status: "doing", title: "In Progress" },
  { status: "done", title: "Done" },
];

export default function BoardPage() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [enabled, setEnabled] = useState(false);

  // 초기 데이터 로드 (최초 1회 및 명시적 새로고침 시에만 사용)
  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, sub_tasks(*)")
      .order("order", { ascending: true });
    if (data) setTasks(data as Task[]);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const animation = requestAnimationFrame(() => {
      if (isMounted) setEnabled(true);
    });

    // 처음에만 전체 데이터를 불러옵니다.
    loadTasks();

    // [Unit 4.3] 실시간 부분 패칭(Patching) 도입
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          // 서버에서 전체 데이터를 다시 불러오지 않고, 클라이언트 상태만 직접 수정합니다.
          setTasks((currentTasks) => {
            // 1. 새로운 할 일이 추가된 경우 (INSERT)
            if (payload.eventType === "INSERT") {
              // 이미 존재하는 데이터인지 확인 (중복 방지)
              if (currentTasks.some((t) => t.id === payload.new.id))
                return currentTasks;

              // [수정 포인트] payload.new가 Task 타입의 모든 속성을 가지고 있음을 TS에 명확히 알려줍니다.
              const newTask = payload.new as unknown as Task;
              return [...currentTasks, { ...newTask, sub_tasks: [] }];
            }

            // 2. 할 일이 수정/이동된 경우 (UPDATE)
            if (payload.eventType === "UPDATE") {
              const updatedTask = payload.new as unknown as Task; // 여기도 추가
              return currentTasks
                .map((t) =>
                  t.id === updatedTask.id
                    ? { ...t, ...updatedTask, sub_tasks: t.sub_tasks }
                    : t,
                )
                .sort((a, b) => a.order - b.order);
            }

            // 3. 할 일이 삭제된 경우 (DELETE)
            if (payload.eventType === "DELETE") {
              return currentTasks.filter((t) => t.id !== payload.old.id);
            }

            return currentTasks;
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animation);
      void supabase.removeChannel(channel);
    };
  }, [loadTasks, supabase]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const previousTasks = [...tasks];
    const newTasks = [...tasks];
    const taskIndex = newTasks.findIndex((t) => t.id === Number(draggableId));

    const movedTask = {
      ...newTasks[taskIndex],
      status: destination.droppableId,
    };
    newTasks.splice(taskIndex, 1);

    const destTasks = newTasks.filter(
      (t) => t.status === destination.droppableId,
    );
    destTasks.splice(destination.index, 0, movedTask);

    const updatedDestTasks = destTasks.map((t, idx) => ({ ...t, order: idx }));
    const otherTasks = newTasks.filter(
      (t) => t.status !== destination.droppableId,
    );
    const finalTasks = [...otherTasks, ...updatedDestTasks];

    // [낙관적 업데이트] 화면 먼저 변경
    setTasks(finalTasks);

    try {
      const payload = updatedDestTasks.map((t) => ({
        id: t.id,
        status: t.status,
        order: t.order,
      }));
      // action.ts의 revalidatePath가 제거되었으므로 서버만 조용히 갱신됨
      const response = await updateTasksOrder(payload);
      if (!response.success) throw new Error(response.error);
    } catch (error) {
      console.error("Sync failed:", error);
      setTasks(previousTasks); // 실패 시 롤백
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // 추가 후 결과 처리를 기다리지 않고 입력창 즉시 비우기 (체감 속도 증가)
    const titleToSave = newTaskTitle;
    setNewTaskTitle("");

    const result = await createTask(titleToSave);
    if (!result.success) {
      setNewTaskTitle(titleToSave); // 실패 시 입력창 롤백
      alert("할 일 추가에 실패했습니다.");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) setTasks(previousTasks);
  };

  if (!enabled)
    return (
      <div className="p-8 min-h-screen bg-gray-900 flex items-center justify-center">
        {/* [Unit 4.4] 레이아웃 시프트를 막기 위한 임시 스켈레톤/스피너 크기 고정 */}
        <div className="w-full h-[80vh] flex flex-col items-center justify-center">
          <p className="animate-pulse text-indigo-400 font-bold uppercase tracking-widest">
            Syncing Board...
          </p>
        </div>
      </div>
    );

  return (
    <div className="p-6 md:p-10 text-white flex flex-col h-full max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-indigo-500 uppercase">
            Sync Board
          </h1>
          <p className="text-slate-500 text-sm font-medium ml-1">
            Workspace Management
          </p>
        </div>
        <form onSubmit={handleAddTask} className="flex gap-2 w-full md:w-auto">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="새로운 할 일을 입력하세요"
            className="bg-slate-900/50 border-slate-800 text-white w-full md:w-64 h-11 rounded-xl focus-visible:ring-indigo-500"
          />
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 font-bold h-11 px-6 rounded-xl transition-all active:scale-95"
          >
            추가
          </Button>
        </form>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <TaskColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={tasks}
              onDelete={handleDeleteTask}
              onRefresh={loadTasks}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
