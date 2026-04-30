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

interface TaskCardProps {
  task: {
    id: number;
    title: string;
    status: string;
    content?: string | null;
    due_date?: string | null;
  };
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
  const [editedDueDate, setEditedDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();
  const isDone = task.status === "done";

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
      onRefresh();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      // [수정] any 대신 unknown 사용
      console.error(
        "수정 실패:",
        error instanceof Error
          ? error.message
          : "알 수 없는 에러가 발생했습니다.",
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
          className={`group outline-none mb-4 transition-all ${snapshot.isDragging ? "scale-105 z-50" : ""} ${isDone ? "opacity-60" : ""}`}
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:border-indigo-500/50 transition-all rounded-2xl shadow-md cursor-pointer">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 mr-3 overflow-hidden">
                    <CardTitle
                      className={`text-[15px] font-medium leading-relaxed line-clamp-2 ${isDone ? "line-through text-gray-500" : "text-gray-100 group-hover:text-indigo-300"}`}
                    >
                      {task.title}
                    </CardTitle>
                    {task.content && (
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 italic leading-relaxed">
                        {task.content}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("정말 삭제할까요?")) onDelete(task.id);
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {task.due_date && (
                    <div className="flex items-center gap-1.5 mt-1 text-indigo-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-medium">
                        {new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                        }).format(new Date(task.due_date))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>

            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-indigo-400 text-xs uppercase tracking-widest font-black mb-2">
                  Edit Task
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">
                    제목
                  </label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">
                    마감 기한
                  </label>
                  <Input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 rounded-xl color-scheme-dark text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">
                    상세 기록
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 min-h-32 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-gray-400"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="bg-indigo-600 rounded-xl"
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
