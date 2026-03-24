"use client";

import { useState, useEffect } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
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
import { Trash2, FileText, Loader2 } from "lucide-react"; // 아이콘 라이브러리 활용 추천

interface TaskCardProps {
  task: { id: number; title: string; status: string; content: string | null };
  index: number;
  onDelete: (id: number) => void;
  onRefresh: () => void;
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
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const isDone = task.status === "done";

  // 외부(Realtime 등)에서 데이터가 변경되면 내부 에디터 상태도 동기화
  useEffect(() => {
    if (!isDialogOpen) {
      setEditedTitle(task.title);
      setEditedContent(task.content || "");
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
        })
        .eq("id", task.id);

      if (error) throw error;

      onRefresh();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      // unknown으로 변경
      // error가 실제 Error 객체인지 확인하여 안전하게 message에 접근
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 에러가 발생했습니다.";
      console.error("수정 실패:", errorMessage);
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
          style={{
            ...provided.draggableProps.style,
            // 드래그 중일 때의 스타일 최적화
            cursor: snapshot.isDragging ? "grabbing" : "pointer",
          }}
          className={`group outline-none mb-4 last:mb-0 transition-all ${
            snapshot.isDragging ? "scale-105 z-50" : ""
          } ${isDone ? "opacity-60" : "opacity-100"}`}
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card
                className={`bg-gray-800/80 backdrop-blur-sm border-gray-700/50 transition-all duration-200 shadow-md rounded-2xl 
                  ${isDone ? "hover:border-gray-600" : "hover:border-indigo-500/50 hover:bg-gray-700"} 
                  ${snapshot.isDragging ? "shadow-2xl border-indigo-500" : ""}`}
              >
                <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 mr-3 overflow-hidden">
                    <CardTitle
                      className={`text-[15px] font-medium leading-relaxed line-clamp-2 transition-colors 
                        ${isDone ? "line-through text-gray-500" : "text-gray-100 group-hover:text-indigo-300"}`}
                    >
                      {task.title}
                    </CardTitle>
                    {task.content && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <FileText className="w-3 h-3 text-indigo-400/70" />
                        <p className="text-[11px] text-gray-500 truncate">
                          메모 있음
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("정말 이 태스크를 삭제할까요?")) {
                        onDelete(task.id);
                      }
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-gray-900/50 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
              </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md rounded-3xl p-6 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-indigo-400 text-xs uppercase tracking-[0.2em] font-black mb-2">
                  Edit Task
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
                    제목
                  </label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="작업 제목을 입력하세요"
                    className="bg-gray-800/50 border-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
                    상세 기록
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="기술적인 해결 방법이나 메모를 남겨주세요."
                    className="bg-gray-800/50 border-gray-700 text-white min-h-40 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none rounded-xl leading-relaxed"
                  />
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-800 text-gray-400 rounded-xl"
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 font-bold rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
