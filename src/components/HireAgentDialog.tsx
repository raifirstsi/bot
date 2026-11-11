import { useState, useId } from "react";
import {
  Check,
  Sparkles,
  X,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  Users,
  Target,
  Briefcase,
  AlertCircle,
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
  1: "Z1 Điều Hành",
  2: "Z2 Marketing",
  3: "Z3 Bán Hàng",
  4: "Z4 Vận Hành",
  5: "Z5 CSKH",
  6: "Z6 Tài Chính",
  7: "Z7 Nhân Sự",
};

export function HireAgentDialog({ open, onClose, onSelectAgent }: HireAgentDialogProps) {
  const dialogTitleId = useId();
  const [selectedZone, setSelectedZone] = useState<number>(2);
  const [activeAgent, setActiveAgent] = useState<RaiAgentDefinition | null>(
    RAI2_DEPARTMENTS[1]?.agents[0] ?? RAI2_DEPARTMENTS[0]?.agents[0] ?? null
  );
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[88vh] sm:max-w-5xl bg-[#f8fafd] dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-[#e2e8f0] dark:border-slate-800 flex flex-col overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(0, 153, 255, 0.08) 0%, rgba(0, 153, 255, 0.02) 40%, transparent 65%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: 56px Minimalist White */}
        <div className="h-14 px-4 sm:px-6 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <RaiLogo className="h-5 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tracking-tight truncate"
                >
                  Tuyển Nhân Sự Số
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[#0077cc] dark:text-sky-300 border border-[#e2e8f0] dark:border-slate-700 shrink-0">
                  RAI² OS
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 truncate hidden sm:block">
                Giải phóng điểm nghẽn ràng buộc (TOC) của doanh nghiệp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 flex items-center justify-center transition-all shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Horizontal Zone Pills (Minimalist White/Blue) */}
        <div className="md:hidden border-b border-[#e2e8f0] dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 px-3 py-2 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none snap-x">
          {RAI2_DEPARTMENTS.map((dept) => {
            const isSelected = dept.zone === selectedZone;
            const label = SHORT_ZONE_NAMES[dept.zone] || `Z${dept.zone}`;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => handleSelectZone(dept.zone)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 snap-start active:scale-95",
                  isSelected
                    ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                    : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Mobile Back Bar */}
        {mobileView === "detail" && (
          <div className="md:hidden px-4 py-2 bg-white/80 dark:bg-slate-800/80 border-b border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0077cc] dark:text-sky-400 active:opacity-70 py-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
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
          <div className="hidden md:block w-64 lg:w-72 border-r border-[#e2e8f0] dark:border-slate-800 overflow-y-auto p-3 space-y-1 bg-white/40 dark:bg-slate-950/20 shrink-0">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
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
                    "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2.5 text-xs",
                    isSelected
                      ? "bg-white dark:bg-slate-800 shadow-2xs border border-[#e2e8f0] dark:border-slate-700 text-[#0f172a] dark:text-white font-bold"
                      : "text-[#475569] dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                      isSelected
                        ? "bg-[#0099ff] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    Z{dept.zone}
                  </div>
                  <div className="flex-1 min-w-0 truncate">
                    {dept.name}
                  </div>
                  {isSelected && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center Column: Department Agents List */}
          <div
            className={cn(
              "overflow-y-auto p-3 sm:p-4 space-y-2.5",
              mobileView === "list" ? "flex-1 w-full" : "hidden md:block",
              "md:w-72 lg:w-80 md:border-r border-[#e2e8f0] dark:border-slate-800 md:shrink-0"
            )}
          >
            {/* Department Summary Header Card */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-[#e2e8f0] dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold uppercase text-[#0077cc] dark:text-sky-400">
                  Vùng {currentDepartment.zone}
                </span>
                <span className="text-[10px] text-slate-400">
                  {currentDepartment.agents.length} nhân sự
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#0f172a] dark:text-white">
                {currentDepartment.name}
              </h3>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-snug mt-1">
                {currentDepartment.description}
              </p>
            </div>

            {/* List of Agents (Pure White Cards with Hairline Border) */}
            <div className="space-y-2">
              {currentDepartment.agents.map((agent) => {
                const isActive = activeAgent?.key === agent.key;

                return (
                  <div
                    key={agent.key}
                    onClick={() => handleAgentClick(agent)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all cursor-pointer relative active:scale-[0.99] shadow-2xs",
                      isActive
                        ? "border-[#0099ff] bg-white dark:bg-slate-900 ring-1 ring-[#0099ff]/40"
                        : "border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0099ff] shrink-0" />
                        <span className="font-bold text-[#0f172a] dark:text-white text-xs sm:text-sm truncate">
                          {agent.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 shrink-0">
                        Z{agent.zone}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-[#475569] dark:text-slate-400 mb-1 truncate">
                      {agent.title}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                      {agent.tagline}
                    </p>

                    <div className="mb-2">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[#0077cc] dark:text-sky-300 border border-slate-200/60 dark:border-slate-700">
                        KPI: {agent.kpiCommitment}
                      </span>
                    </div>

                    <div className="md:hidden pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-[#0077cc] dark:text-sky-400 font-bold">
                      <span>Xem chi tiết & Kích hoạt</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Agent Profile (Clean Minimalist White) */}
          <div
            className={cn(
              "overflow-y-auto bg-transparent flex-1 flex flex-col",
              mobileView === "detail" ? "w-full block" : "hidden md:flex"
            )}
          >
            {activeAgent ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-6 space-y-3.5 max-w-2xl">
                  {/* Agent Header Hero */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#0077cc] dark:text-sky-400 uppercase tracking-wider">
                        {activeAgent.departmentName}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeAgent.key.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] dark:text-white tracking-tight">
                      {activeAgent.name}
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-slate-300 mt-0.5 font-medium">
                      {activeAgent.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {activeAgent.tagline}
                    </p>
                  </div>

                  {/* Pain Point in SME */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs">
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#0077cc] shrink-0" />
                      <span>Vấn Đề Giải Quyết:</span>
                    </div>
                    <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
                      {activeAgent.painPoint}
                    </p>
                  </div>

                  {/* KPI Output Commitment */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs">
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
                      <span>Cam Kết Đầu Ra (KPI):</span>
                    </div>
                    <p className="text-xs text-[#0077cc] dark:text-sky-300 leading-relaxed font-semibold">
                      {activeAgent.kpiCommitment}
                    </p>
                  </div>

                  {/* 80% Prebaked Operating DNA */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs space-y-2">
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0099ff] shrink-0" />
                      <span>80% Nghiệp Vụ Chuẩn Hóa Nạp Sẵn:</span>
                    </div>
                    <div className="space-y-1.5">
                      {activeAgent.prebakedDna.map((dna, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#475569] dark:text-slate-300"
                        >
                          <Check className="w-3.5 h-3.5 text-[#0099ff] shrink-0 mt-0.5" />
                          <span className="leading-snug">{dna}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Single-Task Boundary */}
                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Đơn nhiệm chuyên sâu, log kiểm toán minh bạch dưới quyền CAIO.</span>
                  </div>
                </div>

                {/* Sticky Action Footer CTA */}
                <div className="sticky bottom-0 left-0 right-0 p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-slate-800 z-20 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                  <div className="max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(activeAgent);
                        onClose();
                      }}
                      className="w-full py-3 px-5 rounded-full bg-[#0f172a] hover:bg-slate-800 dark:bg-[#0099ff] dark:hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Kích Hoạt {activeAgent.name} Ngay</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-1">
                      Chuẩn RAI² OS · Tối ưu điểm nghẽn TOC · Kích hoạt 1-Click
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs p-6">
                Chọn một nhân sự số để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
