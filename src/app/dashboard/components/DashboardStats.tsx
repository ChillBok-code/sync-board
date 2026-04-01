import { Stat } from "../types";

const COLORS = ["#818CF8", "#FBBF24", "#10B981"];

export default function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {stats.map((item, index) => (
        <div
          key={item.name}
          className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl shadow-xl transition-transform hover:scale-[1.02]"
        >
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">
            {item.name}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className="text-4xl font-black"
              style={{ color: COLORS[index % COLORS.length] }}
            >
              {item.value}
            </h3>
            <span className="text-gray-500 font-bold text-sm">개</span>
          </div>
        </div>
      ))}
    </div>
  );
}
