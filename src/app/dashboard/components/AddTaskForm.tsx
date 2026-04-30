"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Loader2, Plus } from "lucide-react";

export default function AddTaskForm({
  onAdd,
  isPending,
}: {
  onAdd: (fd: FormData) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPending) return;

    const fd = new FormData();
    fd.append("title", title);
    if (dueDate) fd.append("due_date", dueDate);

    onAdd(fd);
    setTitle("");
    setDueDate("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-center">
      <div className="relative flex-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="어떤 할 일이 있나요?"
          disabled={isPending}
          className="bg-gray-800/50 border-gray-700/50 text-white h-14 rounded-2xl pl-5 pr-5 w-full focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="relative w-44">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={isPending}
          className="bg-gray-800/50 border-gray-700/50 text-gray-300 h-14 rounded-2xl cursor-pointer color-scheme-dark focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !title.trim()}
        className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shrink-0 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
      >
        {isPending ? (
          <Loader2 className="animate-spin w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>
    </form>
  );
}
