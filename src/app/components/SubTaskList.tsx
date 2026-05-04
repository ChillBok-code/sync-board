"use client";

import { useState, useOptimistic, startTransition, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Progress } from "@/shared/ui/progress";
import {
  Trash2,
  Edit2,
  Plus,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SubTask } from "@/shared/types";
import {
  createSubTask,
  toggleSubTask,
  deleteSubTask,
  updateSubTaskTitle,
} from "@/app/sub-task-action";

interface SubTaskListProps {
  taskId: number | string;
  initialSubTasks: SubTask[];
  onRefresh: () => void;
}

type OptimisticAction =
  | { type: "ADD"; payload: SubTask }
  | { type: "TOGGLE"; id: string; isCompleted: boolean }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; id: string; title: string };

export default function SubTaskList({
  taskId,
  initialSubTasks,
  onRefresh,
}: SubTaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isPending, setIsPending] = useState(false);

  // 🔥 [Unit 4.5] 아코디언 UI 상태 관리 (10개 초과 시 접기)
  const [isListExpanded, setIsListExpanded] = useState(false);
  const SHOW_LIMIT = 10;

  // [Unit 4.1] 스크롤 점프 방지를 위한 로컬 기준 상태
  const [baseSubTasks, setBaseSubTasks] = useState<SubTask[]>(initialSubTasks);

  useEffect(() => {
    setBaseSubTasks(initialSubTasks);
  }, [initialSubTasks]);

  const [optimisticSubTasks, dispatchOptimistic] = useOptimistic<
    SubTask[],
    OptimisticAction
  >(baseSubTasks, (state, action) => {
    switch (action.type) {
      case "ADD":
        return [...state, action.payload];
      case "TOGGLE":
        return state.map((st) =>
          st.id === action.id
            ? { ...st, is_completed: action.isCompleted }
            : st,
        );
      case "DELETE":
        return state.filter((st) => st.id !== action.id);
      case "UPDATE":
        return state.map((st) =>
          st.id === action.id ? { ...st, title: action.title } : st,
        );
      default:
        return state;
    }
  });

  // 진행률 계산
  const totalTasks = optimisticSubTasks.length;
  const completedTasks = optimisticSubTasks.filter(
    (st) => st.is_completed,
  ).length;
  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // 🔥 [Unit 4.5] 화면에 노출될 항목 분리 계산
  const visibleTasks = isListExpanded
    ? optimisticSubTasks
    : optimisticSubTasks.slice(0, SHOW_LIMIT);
  const hiddenCount = optimisticSubTasks.length - SHOW_LIMIT;

  // 1. 하위 할 일 추가
  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim() || isPending) return;

    const tempId = `temp-${Date.now()}`;
    const titleToSave = newTaskTitle.trim();

    setNewTaskTitle("");
    setIsPending(true);

    // 새 항목 추가 시 아코디언을 자동으로 펼쳐서 추가된 항목이 보이게 함
    if (!isListExpanded && optimisticSubTasks.length >= SHOW_LIMIT) {
      setIsListExpanded(true);
    }

    startTransition(async () => {
      dispatchOptimistic({
        type: "ADD",
        payload: {
          id: tempId,
          task_id: String(taskId),
          title: titleToSave,
          is_completed: false,
          created_at: new Date().toISOString(),
        },
      });

      const res = await createSubTask(taskId, titleToSave);
      if (res.success) {
        await onRefresh();
      } else {
        alert(`생성 실패: ${res.error}`);
      }
      setIsPending(false);
    });
  };

  // 2. 완료 상태 토글 (스크롤 점프 완벽 제어)
  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const newStatus = !currentStatus;
      dispatchOptimistic({ type: "TOGGLE", id, isCompleted: newStatus });

      const res = await toggleSubTask(id, newStatus);
      if (res.success) {
        setBaseSubTasks((prev) =>
          prev.map((st) =>
            st.id === id ? { ...st, is_completed: newStatus } : st,
          ),
        );
      } else {
        alert(`상태 변경 실패: ${res.error}`);
      }
    });
  };

  // 3. 하위 할 일 삭제
  const handleDelete = (id: string) => {
    if (!confirm("이 하위 할 일을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      dispatchOptimistic({ type: "DELETE", id });

      const res = await deleteSubTask(id);
      if (res.success) {
        setBaseSubTasks((prev) => prev.filter((st) => st.id !== id));
      } else {
        alert(`삭제 실패: ${res.error}`);
      }
    });
  };

  // 4. 제목 수정 저장
  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    const titleToSave = editTitle.trim();
    setEditingId(null);

    startTransition(async () => {
      dispatchOptimistic({ type: "UPDATE", id, title: titleToSave });

      const res = await updateSubTaskTitle(id, titleToSave);
      if (res.success) {
        setBaseSubTasks((prev) =>
          prev.map((st) => (st.id === id ? { ...st, title: titleToSave } : st)),
        );
      } else {
        alert(`수정 실패: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-4 mt-6 p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
      <div className="flex justify-between items-end mb-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          체크리스트
        </label>
        <span className="text-xs font-medium text-indigo-400">
          {progressPercentage}% 완료
        </span>
      </div>

      <Progress
        value={progressPercentage}
        className="h-2 bg-gray-800 [&>div]:bg-indigo-500 [&>div]:transition-all [&>div]:duration-500 [&>div]:ease-in-out"
      />

      <div className="space-y-2 mt-4 max-h-50 overflow-y-auto pr-2 custom-scrollbar">
        {/* 🔥 [Unit 4.5] 전체 데이터가 아닌 visibleTasks(최대 10개)만 렌더링 */}
        {visibleTasks.map((st) => (
          <div
            key={st.id}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800/50 transition-colors group"
          >
            {editingId === st.id ? (
              <div className="flex w-full items-center gap-2">
                <Input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(st.id)}
                  className="h-8 bg-gray-950 border-gray-700 text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-emerald-400"
                  onClick={() => handleSaveEdit(st.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400"
                  onClick={() => setEditingId(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <Checkbox
                  checked={st.is_completed}
                  onCheckedChange={() => handleToggle(st.id, st.is_completed)}
                  className="border-gray-600 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                />
                <span
                  className={`flex-1 text-sm transition-all ${st.is_completed ? "line-through text-gray-500" : "text-gray-200"}`}
                >
                  {st.title}
                </span>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(st.id);
                      setEditTitle(st.title);
                    }}
                    className="p-1.5 text-gray-500 hover:text-indigo-400"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(st.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* 🔥 [Unit 4.5] 10개 초과 시 노출되는 '더보기/간략히 보기' 버튼 */}
        {hiddenCount > 0 && (
          <div className="pt-2 flex justify-center border-t border-gray-800/50 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8 rounded-full px-4 transition-all"
              onClick={() => setIsListExpanded(!isListExpanded)}
            >
              {isListExpanded ? (
                <>
                  간략히 보기 <ChevronUp className="w-3 h-3 ml-1" />
                </>
              ) : (
                <>
                  {hiddenCount}개 항목 더보기{" "}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {optimisticSubTasks.length === 0 && (
          <p className="text-center text-xs text-gray-500 py-4 italic">
            하위 할 일이 없습니다.
          </p>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="flex gap-2 mt-2 pt-2 border-t border-gray-800/50"
      >
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="새 체크리스트 추가..."
          className="h-10 bg-gray-950/50 border-gray-700/50 text-sm"
          disabled={isPending}
        />
        <Button
          type="submit"
          disabled={!newTaskTitle.trim() || isPending}
          size="icon"
          className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
