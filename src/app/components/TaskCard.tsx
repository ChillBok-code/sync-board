"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea"; // 상세 내용용
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/shared/ui/dialog"; // 모달용
import { createClient } from "@/shared/lib/supabase/client";

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
  const supabase = createClient();

  const isDone = task.status === "done";

  // 상세 정보 저장 (제목 + 내용)
  const handleSaveDetails = async () => {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: editedTitle,
        content: editedContent,
      })
      .eq("id", task.id);

    if (error) {
      console.error("수정 실패:", error.message);
    } else {
      onRefresh();
      setIsDialogOpen(false);
    }
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, _snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          className={`transition-opacity duration-300 ${isDone ? "opacity-50" : "opacity-100"}`}
        >
          {/* 모달(Dialog)로 카드 전체를 감쌉니다 */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card
                className={`bg-gray-800 border-gray-700/50 transition-all duration-300 shadow-lg rounded-2xl group cursor-pointer
                  ${isDone ? "hover:border-gray-600" : "hover:border-indigo-500/50 hover:bg-gray-700/50"}`}
              >
                <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                  <div className="flex-1 mr-2 overflow-hidden">
                    <CardTitle
                      className={`text-md font-semibold leading-snug line-clamp-2 whitespace-normal transition-colors 
    ${isDone ? "line-through text-gray-500" : "text-gray-200 group-hover:text-indigo-400"}`}
                    >
                      {task.title}
                    </CardTitle>
                    {/* 카드 하단에 내용이 있다는 표시를 살짝 줍니다 (포트폴리오 디테일) */}
                    {task.content && (
                      <p className="text-[10px] text-gray-500 mt-1 truncate">
                        내용 있음...
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
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
            </DialogTrigger>

            {/* 모달 상세 내용 창 */}
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-indigo-400 text-xs uppercase tracking-widest font-black">
                  Task Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    제목
                  </label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    상세 기록 (트러블슈팅/메모)
                  </label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="이 작업에서 겪은 문제나 기술적 해결 방법을 기록하세요."
                    className="bg-gray-800 border-gray-700 text-white min-h-50 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="hover:bg-gray-800 text-gray-400"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveDetails}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 font-bold"
                >
                  저장하기
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </Draggable>
  );
}
