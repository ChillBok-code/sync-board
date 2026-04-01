import { Droppable } from "@hello-pangea/dnd";
import { Badge } from "@/shared/ui/badge";
import TaskCard from "./TaskCard";

interface Task {
  id: number;
  title: string;
  content: string | null;
  status: string;
  order: number;
}

interface BoardColumnProps {
  status: string;
  title: string;
  tasks: Task[];
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function BoardColumn({
  status,
  title,
  tasks,
  onDelete,
  onRefresh,
}: BoardColumnProps) {
  const columnTasks = tasks.filter((t) => t.status === status);

  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="bg-slate-900/40 p-5 rounded-3xl flex flex-col border border-slate-800/50 min-h-125"
        >
          <h2 className="font-bold text-sm mb-5 flex justify-between items-center text-slate-500 uppercase tracking-[0.2em] px-2">
            {title}
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none px-2.5 py-0.5 rounded-full">
              {columnTasks.length}
            </Badge>
          </h2>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {columnTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={onDelete}
                onRefresh={onRefresh}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
