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
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { RAI2_DEPARTMENTS, type RaiAgentDefinition } from "@/lib/rai2-departments";
import { RaiLogo } from "./RaiLogo";

interface HireAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectAgent?: (agent: RaiAgentDefinition) => void;
}

const SHORT_ZONE_NAMES: Record<number, string> = {
  1: "Z1 · Điều Hành",
  2: "Z2 · Marketing & Lead",
  3: "Z3 · Bán Hàng & Chốt",
  4: "Z4 · Vận Hành & Giao",
  5: "Z5 · Chăm Sóc KH",
  6: "Z6 · Tài Chính & Dòng Tiền",
  7: "Z7 · Nhân Sự & Văn Hóa",
};

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800",
  orange: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800",
  pink: "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200/80 dark:border-pink-800",
  coral: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800",
  yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200/80 dark:border-yellow-800",
  silver: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  chrome: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800",
};

export function HireAgentDialog({ open, onClose, onSelectAgent }: HireAgentDialogProps) {
  const dialogTitleId = useId();
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [activeAgent, setActiveAgent] = useState<RaiAgentDefinition | null>(
    RAI2_DEPARTMENTS[1]?.agents[0] ?? RAI2_DEPARTMENTS[0]?.agents[0] ?? null
  );
  // Mobile master-detail flow: "list" shows zone agents, "detail" shows full single-agent profile
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      {/* Modal Dialog: Full viewport height and 0 border-radius on mobile, rounded container on desktop */}
      <div
        className="relative w-full h-[100dvh] sm:h-[88vh] sm:max-w-5xl bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Header: 56px Apple/Linear precision bar */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <RaiLogo className="h-5 sm:h-6 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate"
                >
                  Tuyển Nhân Sự Số
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-[#0099ff] dark:text-sky-300 border border-sky-200/60 dark:border-sky-800 shrink-0">
                  RAI² FIRST OS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Kích hoạt 1–2 nhân sự số giải phóng đúng điểm nghẽn ràng buộc (TOC) của doanh nghiệp bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 flex items-center justify-center transition-all shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Horizontal Department Zone Selector (Mobile only, hidden on md+) */}
        <div className="md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-3 py-2.5 overflow-x-auto flex gap-2 shrink-0 scrollbar-none snap-x">
          {RAI2_DEPARTMENTS.map((dept) => {
            const isSelected = dept.zone === selectedZone;
            const label = SHORT_ZONE_NAMES[dept.zone] || `Z${dept.zone} · ${dept.name.replace(/^Phòng\s+/i, "")}`;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => handleSelectZone(dept.zone)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
                  isSelected
                    ? "bg-slate-900 dark:bg-[#0099ff] text-white shadow-xs font-bold"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700"
                )}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Back Bar (Only visible when mobileView === "detail" on mobile) */}
        {mobileView === "detail" && (
          <div className="md:hidden px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-700 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099ff] dark:text-sky-400 active:opacity-70 py-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại {currentDepartment.name.replace(/^Phòng\s+/i, "")}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              Vùng {selectedZone} ({currentDepartment.agents.length} nhân sự)
            </span>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: 7 Departments Navigation (Desktop only) */}
          <div className="hidden md:block w-64 lg:w-72 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>7 Vùng Nghiệp Vụ TOC</span>
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
                        ? "bg-[#0099ff] text-white shadow-xs"
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
                    <ChevronRight className="w-4 h-4 text-[#0099ff] shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center Column: Department Agents List */}
          {/* Mobile: visible when mobileView === "list". Desktop: always visible */}
          <div
            className={cn(
              "overflow-y-auto p-4 space-y-3",
              mobileView === "list" ? "flex-1 w-full" : "hidden md:block",
              "md:w-72 lg:w-80 md:border-r border-slate-100 dark:border-slate-800 md:shrink-0"
            )}
          >
            {/* Department Summary Header Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0099ff] dark:text-sky-400">
                  Vùng {currentDepartment.zone}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {currentDepartment.agents.length} nhân sự số
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                {currentDepartment.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {currentDepartment.description}
              </p>
            </div>

            {/* List of Agents */}
            <div className="space-y-2.5">
              {currentDepartment.agents.map((agent) => {
                const isActive = activeAgent?.key === agent.key;
                const badgeClass = COLOR_CLASSES[agent.color] ?? COLOR_CLASSES.blue;

                return (
                  <div
                    key={agent.key}
                    onClick={() => handleAgentClick(agent)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer relative active:scale-[0.98] shadow-2xs",
                      isActive
                        ? "border-[#0099ff] bg-sky-50/40 dark:bg-sky-950/20 ring-1 ring-[#0099ff]/50"
                        : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {agent.name}
                        </span>
                      </div>
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0", badgeClass)}>
                        Z{agent.zone}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">
                      {agent.title}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2.5">
                      {agent.tagline}
                    </p>

                    {/* KPI Commitment Chip */}
                    <div className="mb-2.5">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                        KPI: {agent.kpiCommitment}
                      </span>
                    </div>

                    {/* Mobile Tap Link Indicator */}
                    <div className="md:hidden pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-[#0099ff] dark:text-sky-400 font-bold">
                      <span>Xem hồ sơ chi tiết & Kích hoạt</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Agent Profile & 1-Click Hiring */}
          {/* Mobile: visible when mobileView === "detail". Desktop: always visible */}
          <div
            className={cn(
              "overflow-y-auto bg-slate-50/40 dark:bg-slate-950/20 flex-1 flex flex-col",
              mobileView === "detail" ? "w-full block" : "hidden md:flex"
            )}
          >
            {activeAgent ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
                  {/* Agent Header Hero */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#0099ff] dark:text-sky-400 uppercase tracking-wider">
                        {activeAgent.departmentName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        MÃ: {activeAgent.key.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {activeAgent.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                      {activeAgent.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {activeAgent.tagline}
                    </p>
                  </div>

                  {/* Practical Pain Point in SME */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>Nỗi Đau Thực Tế Của Doanh Nghiệp SME:</span>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                      {activeAgent.painPoint}
                    </p>
                  </div>

                  {/* KPI Output Commitment */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
                    <div className="text-xs font-bold text-sky-800 dark:text-sky-300 mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
                      <span>Cam Kết Hiệu Suất Đầu Ra (KPI):</span>
                    </div>
                    <p className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed font-semibold">
                      {activeAgent.kpiCommitment}
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
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-2xs"
                        >
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{dna}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TOC Trigger & Single-Task Boundary */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ranh Giới Đơn Nhiệm (Single-Task):</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Chỉ phụ trách duy nhất một chuyên môn cốt lõi, không kiêm nhiệm lan man. Toàn bộ hành vi được ghi log kiểm toán và đặt dưới sự giám sát của CAIO.
                    </p>
                  </div>
                </div>

                {/* Sticky Action Footer CTA */}
                <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <div className="max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(activeAgent);
                        onClose();
                      }}
                      className="w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-[#0099ff] dark:hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Tuyển & Kích Hoạt {activeAgent.name} Ngay</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1.5">
                      Chuẩn hóa theo RAI² FIRST OS · Biên lợi nhuận ròng $\ge 35\%$ · 1-Click Kích Hoạt
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs sm:text-sm p-6">
                Chọn một nhân sự số để xem chi tiết hồ sơ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
