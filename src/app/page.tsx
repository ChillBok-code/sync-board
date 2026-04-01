"use client";

import { createTask, updateTasksOrder } from "@/app/action";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import TaskColumn from "@/app/components/TaskColumn";

interface Task {
  id: number;
  title: string;
  content: string | null;
  status: string;
  order: number;
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

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("order", { ascending: true });
    if (data) setTasks(data as Task[]);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const animation = requestAnimationFrame(() => {
      if (isMounted) setEnabled(true);
    });
    loadTasks();

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

    setTasks(finalTasks);

    try {
      const payload = updatedDestTasks.map((t) => ({
        id: t.id,
        status: t.status,
        order: t.order,
      }));
      const response = await updateTasksOrder(payload);
      if (!response.success) throw new Error(response.error);
    } catch (error) {
      console.error("Sync failed:", error);
      setTasks(previousTasks);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const result = await createTask(newTaskTitle);
    if (result.success) setNewTaskTitle("");
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
        <p className="animate-pulse text-indigo-400 font-bold uppercase tracking-widest">
          Syncing Board...
        </p>
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
