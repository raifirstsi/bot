import { useState } from "react";
import { Check, Sparkles, X, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import { RAI2_DEPARTMENTS, type RaiAgentDefinition, type RaiDepartment } from "@/lib/rai2-departments";
import { RaiLogo } from "./RaiLogo";

interface HireAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectAgent?: (agent: RaiAgentDefinition) => void;
}

export function HireAgentDialog({ open, onClose, onSelectAgent }: HireAgentDialogProps) {
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [activeAgent, setActiveAgent] = useState<RaiAgentDefinition | null>(
    RAI2_DEPARTMENTS[0]?.agents[0] ?? null
  );

  if (!open) return null;

  const currentDepartment = RAI2_DEPARTMENTS.find((d) => d.zone === selectedZone) ?? RAI2_DEPARTMENTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-b from-sky-50/50 to-transparent dark:from-sky-950/20">
          <div className="flex items-center gap-3">
            <RaiLogo className="h-6 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Bàn Tuyển Dụng Nhân Sự Số 7 Phòng Ban
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                  RAI² FIRST OS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kích hoạt 1–2 nhân sự số giải phóng đúng điểm nghẽn ràng buộc (TOC) của doanh nghiệp bạn.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: 7 Departments Navigation */}
          <div className="w-72 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              7 Vùng Kinh Doanh Chuẩn Sách
            </div>
            {RAI2_DEPARTMENTS.map((dept) => {
              const isSelected = dept.zone === selectedZone;
              return (
                <button
                  key={dept.code}
                  onClick={() => {
                    setSelectedZone(dept.zone);
                    setActiveAgent(dept.agents[0] ?? null);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative text-sm",
                    isSelected
                      ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                    isSelected 
                      ? "bg-sky-500 text-white shadow-sm" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}>
                    Z{dept.zone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {dept.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {dept.agents.length} nhân sự số
                    </div>
                  </div>
                  {isSelected && (
                    <ChevronRight className="w-4 h-4 text-sky-500 shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center Column: Agents List in Department */}
          <div className="w-80 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-3 shrink-0">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Nhân Sự Thuộc {currentDepartment.name}
            </div>

            {currentDepartment.agents.map((agent) => {
              const isActive = activeAgent?.key === agent.key;
              return (
                <div
                  key={agent.key}
                  onClick={() => setActiveAgent(agent)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer relative",
                    isActive
                      ? "border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 shadow-sm ring-1 ring-sky-500"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {agent.name}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                      agent.color === "green" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
                      agent.color === "blue" && "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300",
                      agent.color === "purple" && "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
                      agent.color === "orange" && "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
                      agent.color === "yellow" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300",
                      agent.color === "teal" && "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300",
                      agent.color === "pink" && "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300",
                      agent.color === "cyan" && "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300",
                      agent.color === "coral" && "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300",
                      agent.color === "silver" && "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
                      agent.color === "chrome" && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
                    )}>
                      Zone {agent.zone}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    {agent.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {agent.tagline}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Profile & Activation Preview */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/10">
            {activeAgent ? (
              <div className="space-y-6 max-w-xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      {activeAgent.departmentName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      Mã nhân sự: {activeAgent.key.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {activeAgent.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {activeAgent.title}
                  </p>
                </div>

                {/* Practical Pain Point */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Nỗi Đau Thực Tế Của Doanh Nghiệp SME:
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                    {activeAgent.painPoint}
                  </p>
                </div>

                {/* 80% Prebaked Operating DNA */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    80% Bộ Gen Nghiệp Vụ Nạp Sẵn Từ Sách:
                  </div>
                  <div className="space-y-2">
                    {activeAgent.prebakedDna.map((dna, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-2xs">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{dna}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* KPI Commitment */}
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
                  <div className="text-xs font-bold text-sky-800 dark:text-sky-300 mb-1">
                    🎯 Cam Kết Hiệu Suất Đầu Ra (KPI):
                  </div>
                  <p className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed font-medium">
                    {activeAgent.kpiCommitment}
                  </p>
                </div>

                {/* Action CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onSelectAgent?.(activeAgent);
                      onClose();
                    }}
                    className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tuyển & Kích Hoạt {activeAgent.name} Ngay
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Cấu hình tự động theo chuẩn RAI² FIRST OS · Có thể hủy hoặc đổi vai trò bất kỳ lúc nào.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chọn một nhân sự số bên trái để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
