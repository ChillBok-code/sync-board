"use client";

import { createTask, updateTasksOrder } from "@/app/action"; // updateTasksOrder 추가
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import TaskCard from "@/app/components/TaskCard";

interface Task {
  id: number;
  title: string;
  content: string | null;
  status: string;
  order: number;
}

export default function KanbanPage() {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [enabled, setEnabled] = useState(false);

  // 데이터 로드 함수
  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("order", { ascending: true });

    if (data) {
      setTasks(data as Task[]);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const animation = requestAnimationFrame(() => {
      if (isMounted) setEnabled(true);
    });

    loadTasks();

    // 실시간 구독 설정
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadTasks();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animation);
      void supabase.removeChannel(channel);
    };
  }, [loadTasks, supabase]);

  // 드래그 앤 드롭 종료 시 실행
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // [낙관적 업데이트]
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

    // 순서 재계산
    const updatedDestTasks = destTasks.map((t, idx) => ({ ...t, order: idx }));
    const otherTasks = newTasks.filter(
      (t) => t.status !== destination.droppableId,
    );
    const finalTasks = [...otherTasks, ...updatedDestTasks];

    setTasks(finalTasks);

    // [보안 강화] 서버 액션을 통한 영속성 동기화
    try {
      const payload = updatedDestTasks.map((t) => ({
        id: t.id,
        status: t.status,
        order: t.order,
      }));

      const response = await updateTasksOrder(payload);
      if (!response.success) throw new Error(response.error);
    } catch (error) {
      console.error("동기화 실패:", error);
      setTasks(previousTasks); // 롤백
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const result = await createTask(newTaskTitle);
    if (result.success) {
      setNewTaskTitle("");
    } else {
      alert(result.error || "추가 실패");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("삭제 실패", error);
      setTasks(previousTasks);
    }
  };

  if (!enabled) {
    return (
      <div className="p-8 min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="animate-pulse text-indigo-400 font-bold uppercase tracking-widest">
          Syncing Board...
        </p>
      </div>
    );
  }

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
            placeholder="무엇을 해야 하나요?"
            className="bg-slate-900/50 border-slate-800 text-white w-full md:w-64 h-11 rounded-xl focus-visible:ring-indigo-500"
          />
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 font-bold h-11 px-6 rounded-xl transition-all active:scale-95 shrink-0"
          >
            추가
          </Button>
        </form>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {["todo", "doing", "done"].map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-slate-900/40 p-5 rounded-3xl flex flex-col border border-slate-800/50 min-h-125"
                >
                  <h2 className="font-bold text-sm mb-5 flex justify-between items-center text-slate-500 uppercase tracking-[0.2em] px-2">
                    {status === "todo"
                      ? "To Do"
                      : status === "doing"
                        ? "In Progress"
                        : "Done"}
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-none px-2.5 py-0.5 rounded-full">
                      {tasks.filter((t) => t.status === status).length}
                    </Badge>
                  </h2>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {tasks
                      .filter((t) => t.status === status)
                      .map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onDelete={handleDeleteTask}
                          onRefresh={loadTasks}
                        />
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
