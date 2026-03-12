"use client"; // 브라우저에서 실행 선언

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Task {
  id: number;
  title: string;
  content: string | null;
  status: string;
  order: number;
}

export default function KanbanPage() {
  const router = useRouter();

  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [enabled, setEnabled] = useState(false); // 하이드레이션 미스매치 방어 패턴

  // 세션 무효화 (로그아웃) 핸들러
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 실패:", error.message);
      return;
    }
    router.push("/login");
    router.refresh();
  };

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("order", { ascending: true }); // useCallback 과 참조 안정성

    if (data) {
      setTasks(data as Task[]);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const animation = requestAnimationFrame(() => {
      if (isMounted) setEnabled(true);
    });

    const initialize = async () => {
      await loadTasks();
    };

    initialize();

    // Supabase Realtime 구독 인스턴스 생성
    const channel = supabase
      .channel("tasks-realtime") // 채널 고유 ID
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모두 감지
          schema: "public",
          table: "tasks",
        },
        () => {
          // 데이터 변경 감지 시 최신 목록 재요청(Re-fetching)
          void loadTasks();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animation);
      // [중요] 구독 해제: 메모리 누수 및 좀비 인스턴스 방지, 클린업 함수 사용
      void supabase.removeChannel(channel);
    };
  }, [loadTasks, supabase]);

  // 순서 정렬이 포함된 onDragEnd
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // 1. 예외 처리: 보드 밖으로 던지거나, 제자리에 놨을 때
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // [낙관적 업데이트] 기존 상태(State) 딥 카피(Deep Copy)
    const newTasks = [...tasks];

    // 2. 추출 (Remove): 내가 잡은 카드를 전체 배열에서 뽑아냄
    const taskIndex = newTasks.findIndex((t) => t.id === Number(draggableId));
    const movedTask = newTasks[taskIndex];
    newTasks.splice(taskIndex, 1); // 원래 자리에서 삭제

    // 3. 상태 변경: 카드의 소속 컬럼(status) 업데이트
    movedTask.status = destination.droppableId;

    // 4. 삽입 (Insert): 목적지 컬럼의 배열을 따로 빼서 원하는 인덱스에 밀어 넣음
    const destTasks = newTasks.filter(
      (t) => t.status === destination.droppableId,
    );
    destTasks.splice(destination.index, 0, movedTask);

    // 5. 순서 재계산: 목적지 컬럼 내의 모든 카드들에게 0번부터 새 order 부여
    const updatedDestTasks = destTasks.map((t, idx) => ({ ...t, order: idx }));

    // 6. 배열 재조립 (Re-assemble): 안 건드린 타 컬럼 카드들 + 방금 재정렬한 목적지 컬럼 카드들 합체
    const otherTasks = newTasks.filter(
      (t) => t.status !== destination.droppableId,
    );
    const finalTasks = [...otherTasks, ...updatedDestTasks];

    // 화면 즉시 렌더링
    setTasks(finalTasks);

    // [영속성 레이어 동기화]
    // 개별 Update 요청을 방지하기 위해 Bulk Upsert 방식을 채택 (네트워크 I/O 최적화)
    try {
      const { error } = await supabase.from("tasks").upsert(
        updatedDestTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          order: t.order,
          content: t.content,
        })),
        { onConflict: "id" },
      );

      if (error) throw error;
    } catch (error) {
      console.error("순서 동기화 실패:", error);
      setTasks(tasks); // 실패 시 롤백
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase
      .from("tasks")
      .insert([{ title: newTaskTitle, status: "todo", order: tasks.length }]);

    if (!error) {
      setNewTaskTitle("");
      await loadTasks();
    }
  };

  // 1. KanbanPage 컴포넌트 내부, handleAddTask 아래에 삭제 로직 추가
  const handleDeleteTask = async (taskId: number) => {
    // [낙관적 업데이트] DB 응답을 기다리지 않고 화면의 상태(State)에서 즉시 제거
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));

    // DB에서 해당 레코드 삭제
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    // 삭제 실패 시 원래 상태로 롤백(Rollback)
    if (error) {
      console.error("삭제 실패:", error);
      setTasks(previousTasks);
    }
  };

  if (!enabled) {
    return (
      <div className="p-8 min-h-screen bg-gray-900 text-white">
        Initializing...
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white font-sans">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-indigo-400 uppercase">
              SYNC BOARD
            </h1>
            <p className="text-slate-400 mt-2 text-lg font-medium italic">
              ChillBok-code&apos;s Workspace
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="md:hidden border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Logout
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <form
            onSubmit={handleAddTask}
            className="flex gap-3 bg-gray-800 p-2 rounded-2xl border border-gray-700 shadow-2xl w-full md:w-auto"
          >
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="해야 할 일은 무엇인가요?"
              className="bg-transparent border-none w-64 text-white focus-visible:ring-0 placeholder:text-gray-500"
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-6 font-bold transition-all hover:scale-105 active:scale-95"
            >
              ADD
            </Button>
          </form>

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="hidden md:block border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-full px-6 rounded-xl"
          >
            Logout
          </Button>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["todo", "doing", "done"].map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-gray-800/30 p-6 rounded-3xl min-h-[600px] border border-gray-800/50"
                >
                  <h2 className="font-black text-xl mb-6 flex justify-between items-center text-gray-400 uppercase tracking-widest px-2">
                    {status === "todo"
                      ? "To Do"
                      : status === "doing"
                        ? "In Progress"
                        : "Done"}
                    <Badge
                      variant="outline"
                      className="text-indigo-400 border-indigo-400/30 bg-indigo-400/5 px-3 py-1"
                    >
                      {tasks.filter((t) => t.status === status).length}
                    </Badge>
                  </h2>

                  <div className="space-y-4">
                    {tasks
                      .filter((t) => t.status === status)
                      .map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card className="bg-gray-800 border-gray-700/50 hover:border-indigo-500/50 hover:bg-gray-700/50 transition-all duration-300 shadow-lg rounded-2xl group">
                                {/* Flexbox를 사용해 제목과 삭제 버튼을 양끝으로 배치 (justify-between) */}
                                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                                  <CardTitle className="text-md font-semibold text-gray-200 leading-snug">
                                    {task.title}
                                  </CardTitle>

                                  {/* 🚀 삭제 버튼 추가 및 이벤트 바인딩 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // [핵심] 이벤트 버블링 차단
                                      handleDeleteTask(task.id);
                                    }}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    aria-label="Delete task"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="18"
                                      height="18"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </CardHeader>
                              </Card>
                            </div>
                          )}
                        </Draggable>
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
