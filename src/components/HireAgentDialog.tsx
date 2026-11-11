import { useState, useId } from "react";
import {
  Check,
  Sparkles,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Users,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { RAI2_DEPARTMENTS, type RaiAgentDefinition } from "@/lib/rai2-departments";
import { RaiLogo } from "./RaiLogo";

interface HireAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectAgent?: (agent: RaiAgentDefinition) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300",
  orange: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300",
  coral: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300",
  silver: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  chrome: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300",
};

export function HireAgentDialog({ open, onClose, onSelectAgent }: HireAgentDialogProps) {
  const dialogTitleId = useId();
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [activeAgent, setActiveAgent] = useState<RaiAgentDefinition | null>(
    RAI2_DEPARTMENTS[1]?.agents[0] ?? RAI2_DEPARTMENTS[0]?.agents[0] ?? null
  );
  // On mobile: "list" shows department agents, "detail" shows full profile
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  if (!open) return null;

  const currentDepartment =
    RAI2_DEPARTMENTS.find((d) => d.zone === selectedZone) ?? RAI2_DEPARTMENTS[0];

  const handleSelectZone = (zone: number) => {
    setSelectedZone(zone);
    const dept = RAI2_DEPARTMENTS.find((d) => d.zone === zone);
    if (dept && dept.agents.length > 0) {
      setActiveAgent(dept.agents[0]);
    }
    setMobileView("list");
  };

  const handleAgentClick = (agent: RaiAgentDefinition) => {
    setActiveAgent(agent);
    setMobileView("detail");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[88vh] sm:max-w-5xl bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-b from-sky-50/60 to-transparent dark:from-sky-950/30">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <RaiLogo className="h-5 sm:h-6 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate"
                >
                  Tuyển Nhân Sự Số
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                  RAI² FIRST OS
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
                Kích hoạt 1–2 nhân sự số giải phóng đúng điểm nghẽn ràng buộc (TOC) của doanh nghiệp bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Horizontal Department Zone Selector (Visible only on mobile < md) */}
        <div className="md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-2 py-2 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
          {RAI2_DEPARTMENTS.map((dept) => {
            const isSelected = dept.zone === selectedZone;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => handleSelectZone(dept.zone)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0",
                  isSelected
                    ? "bg-sky-500 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/60"
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-md text-[10px] font-bold inline-flex items-center justify-center",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  )}
                >
                  {dept.zone}
                </span>
                <span>{dept.name.replace(/^Phòng\s+/i, "")}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Back Button when inside Detail View */}
        {mobileView === "detail" && (
          <div className="md:hidden px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 active:opacity-70 py-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại {currentDepartment.name}</span>
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Zone {selectedZone}
            </span>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: 7 Departments Navigation (Desktop only) */}
          <div className="hidden md:block w-64 lg:w-72 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>7 Vùng Kinh Doanh</span>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            {RAI2_DEPARTMENTS.map((dept) => {
              const isSelected = dept.zone === selectedZone;
              return (
                <button
                  key={dept.code}
                  type="button"
                  onClick={() => handleSelectZone(dept.zone)}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative text-sm",
                    isSelected
                      ? "bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                      isSelected
                        ? "bg-sky-500 text-white shadow-xs"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
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

          {/* Center Column: Agents List */}
          {/* On mobile: displayed when mobileView === "list". On desktop: always displayed */}
          <div
            className={cn(
              "overflow-y-auto p-4 space-y-3",
              // Mobile visibility
              mobileView === "list" ? "flex-1 w-full" : "hidden md:block",
              // Desktop layout
              "md:w-72 lg:w-80 md:border-r border-slate-100 dark:border-slate-800 md:shrink-0"
            )}
          >
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Nhân sự ({currentDepartment.agents.length})</span>
              <span className="text-[11px] font-normal normal-case text-slate-400">
                {currentDepartment.name}
              </span>
            </div>

            <div className="space-y-2.5">
              {currentDepartment.agents.map((agent) => {
                const isActive = activeAgent?.key === agent.key;
                const badgeClass = COLOR_CLASSES[agent.color] ?? COLOR_CLASSES.blue;

                return (
                  <div
                    key={agent.key}
                    onClick={() => handleAgentClick(agent)}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative",
                      isActive
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/25 shadow-xs ring-1 ring-sky-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {agent.name}
                      </span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", badgeClass)}>
                        Zone {agent.zone}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                      {agent.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.tagline}
                    </p>

                    {/* Mobile Quick Action Link */}
                    <div className="md:hidden mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-sky-600 dark:text-sky-400 font-semibold">
                      <span>Xem hồ sơ & Tuyển</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Profile & Activation Preview */}
          {/* On mobile: displayed when mobileView === "detail". On desktop: always displayed */}
          <div
            className={cn(
              "overflow-y-auto bg-slate-50/30 dark:bg-slate-950/10 flex-1 flex flex-col",
              mobileView === "detail" ? "w-full block" : "hidden md:flex"
            )}
          >
            {activeAgent ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-xl">
                  {/* Agent Header */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        {activeAgent.departmentName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        Mã: {activeAgent.key.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {activeAgent.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 sm:mt-1">
                      {activeAgent.title}
                    </p>
                  </div>

                  {/* Practical Pain Point */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>Nỗi Đau Thực Tế Của Doanh Nghiệp SME:</span>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                      {activeAgent.painPoint}
                    </p>
                  </div>

                  {/* 80% Prebaked Operating DNA */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>80% Bộ Gen Nghiệp Vụ Nạp Sẵn Từ Sách:</span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      {activeAgent.prebakedDna.map((dna, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-2xs"
                        >
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{dna}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPI Commitment */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
                    <div className="text-xs font-bold text-sky-800 dark:text-sky-300 mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>Cam Kết Hiệu Suất Đầu Ra (KPI):</span>
                    </div>
                    <p className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed font-medium">
                      {activeAgent.kpiCommitment}
                    </p>
                  </div>
                </div>

                {/* Sticky Action CTA on Mobile and Desktop */}
                <div className="sticky bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-10">
                  <div className="max-w-xl mx-auto sm:mx-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(activeAgent);
                        onClose();
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl sm:rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Tuyển & Kích Hoạt {activeAgent.name} Ngay</span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Cấu hình tự động theo chuẩn RAI² FIRST OS · Có thể điều chỉnh bất kỳ lúc nào.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm p-6">
                Chọn một nhân sự số để xem chi tiết hồ sơ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
