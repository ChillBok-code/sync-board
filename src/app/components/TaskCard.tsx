"use client";

import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { createClient } from "@/shared/lib/supabase/client";
import { Trash2, Loader2, Calendar } from "lucide-react";
import SubTaskList from "./SubTaskList";
import { SubTask } from "@/shared/types";

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    status: string;
    content?: string | null;
    due_date?: string | null;
    sub_tasks?: SubTask[];
  };
  index: number;
  onDelete: (id: number) => void;
  onRefresh: () => void; // 보드의 전체 데이터를 다시 불러오는 함수
}

export default function TaskCard({
  task,
  index,
  onDelete,
  onRefresh,
}: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedContent, setEditedContent] = useState(task.content || "");
  const [editedDueDate, setEditedDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const isDone = task.status === "done";

  // 모달이 닫히거나 외부 데이터 변경 시 상태 동기화
  useEffect(() => {
    if (!isDialogOpen) {
      setEditedTitle(task.title);
      setEditedContent(task.content || "");
      setEditedDueDate(
        task.due_date
          ? new Date(task.due_date).toISOString().split("T")[0]
          : "",
      );
    }
  }, [task, isDialogOpen]);

  const handleSaveDetails = async () => {
    if (!editedTitle.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editedTitle.trim(),
          content: editedContent.trim(),
          due_date: editedDueDate || null,
        })
        .eq("id", task.id);

      if (error) throw error;

      onRefresh(); // 메인 보드 데이터 동기화
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error(
        "수정 실패:",
        error instanceof Error ? error.message : "알 수 없는 에러",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group outline-none mb-4 transition-all ${
            snapshot.isDragging ? "scale-105 z-50 shadow-2xl" : ""
          } ${isDone ? "opacity-60" : ""}`}
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 hover:border-indigo-500/50 transition-all rounded-2xl shadow-lg cursor-pointer overflow-hidden">
                <CardHeader className="p-5 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 mr-3 overflow-hidden">
                    <CardTitle
                      className={`text-[15px] font-semibold leading-snug line-clamp-2 ${
                        isDone
                          ? "line-through text-gray-500"
                          : "text-gray-100 group-hover:text-indigo-300"
                      }`}
                    >
                      {task.title}
                    </CardTitle>
                    {task.content && (
                      <p className="text-[12px] text-gray-400 mt-2 line-clamp-2 italic leading-relaxed">
                        {task.content}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("정말 삭제하시겠습니까?")) onDelete(task.id);
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 mt-2 text-indigo-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium">
                        {new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                        }).format(new Date(task.due_date))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md rounded-3xl p-7 shadow-2xl focus:outline-none">
              <DialogHeader>
                <DialogTitle className="text-indigo-400 text-xs uppercase tracking-widest font-black mb-4">
                  태스크 상세 정보
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                    제목
                  </label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                    마감 기한
                  </label>
                  <Input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 rounded-xl h-11 color-scheme-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">
                    상세 기록
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 min-h-32 rounded-xl resize-none"
                  />
                </div>

                {/* [중요] SubTaskList에 taskId, 초기 데이터, 그리고 onRefresh 함수를 전달합니다. */}
                <SubTaskList
                  taskId={task.id}
                  initialSubTasks={task.sub_tasks || []}
                  onRefresh={onRefresh}
                />
              </div>

              <DialogFooter className="mt-8 gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-gray-400 h-11"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="bg-indigo-600 rounded-xl h-11 px-8 font-bold"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    "변경사항 저장"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Draggable>
  );
}
