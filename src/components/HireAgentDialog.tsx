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
      className="ui-scrim fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      <div
        className="ui-modal relative flex h-[min(760px,94dvh)] w-full max-w-[1000px] flex-col overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline/40 px-5 py-4">
          <div className="min-w-0">
            <h2 id={dialogTitleId} className="truncate text-[17px] font-semibold text-ink">
              Bàn Tuyển Dụng Nhân Sự Số
            </h2>
            <p className="mt-0.5 hidden truncate text-[13px] text-ink-secondary sm:block">
              Chọn một RAI theo đúng vùng nghiệp vụ và điểm nghẽn doanh nghiệp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-icon-button shrink-0"
            aria-label="Đóng"
          >
            <X size={18} className="pointer-events-none" />
          </button>
        </div>

        {/* Mobile Horizontal Zone Pills */}
        <div className="flex shrink-0 snap-x gap-1 overflow-x-auto border-b border-hairline/40 p-2 scrollbar-none md:hidden">
          {RAI2_DEPARTMENTS.map((dept) => {
            const isSelected = dept.zone === selectedZone;
            const label = SHORT_ZONE_NAMES[dept.zone] || `Z${dept.zone}`;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => handleSelectZone(dept.zone)}
                className={cn(
                  "shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition-colors",
                  isSelected
                    ? "bg-control font-medium text-ink"
                    : "text-ink-secondary hover:bg-control/50 hover:text-ink"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Mobile Back Bar */}
        {mobileView === "detail" && (
          <div className="flex shrink-0 items-center justify-between border-b border-hairline/40 px-4 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-text"
            >
              <ArrowLeft size={14} />
              <span>Quay lại {currentDepartment.name.replace(/^Phòng\s+/i, "")}</span>
            </button>
            <span className="text-[13px] text-ink-secondary">
              {currentDepartment.agents.length} nhân sự
            </span>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: 7 Departments Navigation (Desktop only) */}
          <div className="hidden w-[200px] shrink-0 flex-col overflow-y-auto border-r border-hairline/40 p-3 md:flex">
            <div className="flex items-center justify-between px-2 pb-2 pt-1 text-[12px] font-medium text-ink-tertiary">
              <span>7 Vùng Nghiệp Vụ</span>
              <Users size={13} className="text-ink-tertiary" />
            </div>
            <div className="space-y-0.5">
              {RAI2_DEPARTMENTS.map((dept) => {
                const isSelected = dept.zone === selectedZone;
                return (
                  <button
                    key={dept.code}
                    type="button"
                    onClick={() => handleSelectZone(dept.zone)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                      isSelected
                        ? "bg-control font-medium text-ink"
                        : "text-ink-secondary hover:bg-control/60 hover:text-ink"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold",
                        isSelected
                          ? "bg-ink/10 text-ink"
                          : "bg-control text-ink-secondary"
                      )}
                    >
                      Z{dept.zone}
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                      {dept.name}
                    </div>
                    {isSelected && (
                      <ChevronRight size={14} className="text-ink-tertiary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Department Agents List */}
          <div
            className={cn(
              "space-y-2 overflow-y-auto p-3",
              mobileView === "list" ? "flex-1 w-full" : "hidden md:block",
              "border-hairline/40 md:w-72 md:shrink-0 md:border-r lg:w-80"
            )}
          >
            {/* Department Summary Header Card */}
            <div className="rounded-xl border border-hairline/40 bg-card p-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-accent-text uppercase tracking-wide">
                  Vùng {currentDepartment.zone}
                </span>
                <span className="text-[11px] text-ink-secondary">
                  {currentDepartment.agents.length} nhân sự
                </span>
              </div>
              <h3 className="text-[13px] font-semibold text-ink">
                {currentDepartment.name}
              </h3>
              <p className="text-[12px] text-ink-secondary leading-snug mt-0.5">
                {currentDepartment.description}
              </p>
            </div>

            {/* List of Agents */}
            <div className="space-y-1.5">
              {currentDepartment.agents.map((agent) => {
                const isActive = activeAgent?.key === agent.key;

                return (
                  <div
                    key={agent.key}
                    onClick={() => handleAgentClick(agent)}
                    className={cn(
                       "cursor-pointer rounded-xl border p-3 transition-colors",
                      isActive
                         ? "border-hairline/60 bg-raised"
                         : "border-hairline/40 bg-card hover:bg-raised/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                       <span className="size-1.5 shrink-0 rounded-full bg-ink/35" />
                        <span className="font-semibold text-ink text-[13px] truncate">
                          {agent.name}
                        </span>
                      </div>
                       <span className="ui-chip shrink-0 bg-control text-ink-secondary">
                        Z{agent.zone}
                      </span>
                    </div>

                    <div className="text-[12px] text-ink-secondary mb-1 truncate">
                      {agent.title}
                    </div>

                    <p className="text-[12px] text-ink-secondary line-clamp-2 leading-relaxed mb-1.5">
                      {agent.tagline}
                    </p>

                     <div className="mb-1.5">
                       <span className="inline-block rounded-md bg-inset px-2 py-0.5 text-[11px] text-ink-secondary">
                        KPI: {agent.kpiCommitment}
                      </span>
                    </div>

                    <div className="md:hidden pt-1.5 border-t border-hairline flex items-center justify-between text-[12px] text-accent-text font-medium">
                      <span>Xem chi tiết & Kích hoạt</span>
                      <ChevronRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Agent Profile */}
          <div
            className={cn(
              "flex flex-1 flex-col overflow-y-auto",
              mobileView === "detail" ? "w-full block" : "hidden md:flex"
            )}
          >
            {activeAgent ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="p-4 sm:p-5 space-y-3 max-w-2xl">
                  {/* Agent Header Hero */}
                  <div className="rounded-xl border border-hairline/40 bg-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-accent-text uppercase tracking-wide">
                        {activeAgent.departmentName}
                      </span>
                      <span className="text-ink-tertiary">·</span>
                      <span className="text-[11px] text-ink-tertiary font-mono">
                        {activeAgent.key.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-ink tracking-tight">
                      {activeAgent.name}
                    </h3>
                    <p className="text-[13px] text-ink-secondary mt-0.5">
                      {activeAgent.title}
                    </p>
                    <p className="text-[13px] text-ink-secondary mt-1 leading-relaxed">
                      {activeAgent.tagline}
                    </p>
                  </div>

                  {/* Pain Point */}
                  <div className="rounded-xl border border-hairline/40 bg-card p-3.5">
                    <div className="text-[13px] font-semibold text-ink mb-1 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-accent-text shrink-0" />
                      <span>Vấn Đề Giải Quyết:</span>
                    </div>
                    <p className="text-[13px] text-ink-secondary leading-relaxed">
                      {activeAgent.painPoint}
                    </p>
                  </div>

                  {/* KPI Output Commitment */}
                  <div className="rounded-xl border border-hairline/40 bg-card p-3.5">
                    <div className="text-[13px] font-semibold text-ink mb-1 flex items-center gap-1.5">
                      <Target size={14} className="text-accent shrink-0" />
                      <span>Cam Kết Đầu Ra (KPI):</span>
                    </div>
                    <p className="text-[13px] text-accent-text leading-relaxed font-medium">
                      {activeAgent.kpiCommitment}
                    </p>
                  </div>

                  {/* 80% Prebaked Operating DNA */}
                  <div className="space-y-2 rounded-xl border border-hairline/40 bg-card p-3.5">
                    <div className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-accent shrink-0" />
                      <span>80% Nghiệp Vụ Nạp Sẵn:</span>
                    </div>
                    <div className="space-y-1.5">
                      {activeAgent.prebakedDna.map((dna, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[13px] text-ink-secondary"
                        >
                          <Check size={13} className="text-accent shrink-0 mt-0.5" />
                          <span className="leading-snug">{dna}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Single-Task Boundary */}
                  <div className="flex items-center gap-2 rounded-lg bg-inset p-3 text-[13px] text-ink-secondary">
                    <Briefcase size={13} className="text-ink-tertiary shrink-0" />
                    <span>Đơn nhiệm chuyên sâu, log kiểm toán minh bạch dưới quyền CAIO.</span>
                  </div>
                </div>

                {/* Sticky Action Footer CTA */}
                <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-hairline/40 bg-panel p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:p-4">
                  <div className="max-w-2xl mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(activeAgent);
                        onClose();
                      }}
                      className="ui-button ui-button-primary ui-button-lg w-full"
                    >
                      <Sparkles size={14} />
                      <span>Kích Hoạt {activeAgent.name} Ngay</span>
                    </button>
                    <p className="text-[11px] text-center text-ink-tertiary mt-1.5">
                      Chuẩn RAI² OS · Tối ưu điểm nghẽn TOC · Kích hoạt 1-Click
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-ink-tertiary text-[13px] p-6">
                Chọn một nhân sự số để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
