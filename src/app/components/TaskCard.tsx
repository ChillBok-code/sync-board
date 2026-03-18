"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/shared/lib/supabase/client";

interface TaskCardProps {
  task: { id: number; title: string; status: string };
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const supabase = createClient();

  // 1. 완료 상태 여부 확인
  const isDone = task.status === "done";

  const handleUpdate = async () => {
    if (!editedTitle.trim() || editedTitle === task.title) {
      setIsEditing(false);
      setEditedTitle(task.title);
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({ title: editedTitle })
      .eq("id", task.id);

    if (error) {
      console.error("수정 실패:", error.message);
      setEditedTitle(task.title);
    } else {
      onRefresh();
    }
    setIsEditing(false);
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          // 2. 완료 시 투명도 조절 (opacity-50)
          className={`transition-opacity duration-300 ${isDone ? "opacity-50" : "opacity-100"}`}
        >
          <Card
            // 3. 완료 시 호버 효과를 다르게 설정
            className={`bg-gray-800 border-gray-700/50 transition-all duration-300 shadow-lg rounded-2xl group 
              ${isDone ? "hover:border-gray-600" : "hover:border-indigo-500/50 hover:bg-gray-700/50"}`}
          >
            <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
              <div className="flex-1 mr-2">
                {isEditing ? (
                  <Input
                    autoFocus
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleUpdate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate();
                      if (e.key === "Escape") {
                        setIsEditing(false);
                        setEditedTitle(task.title);
                      }
                    }}
                    className="bg-gray-900 border-indigo-500 text-white h-8"
                  />
                ) : (
                  <CardTitle
                    // 4. 완료 시 취소선 및 텍스트 색상 변경
                    className={`text-md font-semibold leading-snug cursor-pointer transition-colors 
                      ${isDone ? "line-through text-gray-500 hover:text-gray-400" : "text-gray-200 hover:text-indigo-400"}`}
                    onClick={() => setIsEditing(true)}
                  >
                    {task.title}
                  </CardTitle>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
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
  );
}
