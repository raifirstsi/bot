import { useState, useId } from "react";
import {
  X,
  Gauge,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import {
  diagnoseBusinessConstraint,
  type TocDiagnosticInput,
  type TocDiagnosisResult,
} from "@/lib/toc-detector";
import { RAI2_DEPARTMENTS } from "@/lib/rai2-departments";
import { cn } from "@/lib/cn";

export interface TocConstraintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgentKey?: (agentKey: string) => void;
}

export function TocConstraintModal({
  isOpen,
  onClose,
  onSelectAgentKey,
}: TocConstraintModalProps) {
  const dialogTitleId = useId();

  // Inputs with sensible SME defaults
  const [deliveryCapacity, setDeliveryCapacity] = useState<number>(75);
  const [quoteDays, setQuoteDays] = useState<number>(4);
  const [ownerHours, setOwnerHours] = useState<number>(12);
  const [hasBacklog, setHasBacklog] = useState<boolean>(true);
  const [revenueMillion, setRevenueMillion] = useState<number>(350);
  const [netMargin, setNetMargin] = useState<number>(20);

  if (!isOpen) return null;

  const input: TocDiagnosticInput = {
    hasBacklogOver48h: hasBacklog,
    backlogDepartment: quoteDays >= 3 ? "ZONE_3_SALES" : "ZONE_4_OPERATIONS",
    ownerHoursPerWeekSpentOnOperations: ownerHours,
    deliveryCapacityUtilization: deliveryCapacity,
    quoteTurnaroundDays: quoteDays,
    currentMonthlyRevenue: revenueMillion * 1_000_000,
    currentNetMargin: netMargin,
  };

  const diagnosis: TocDiagnosisResult = diagnoseBusinessConstraint(input);

  // Find agent info
  let recommendedAgentName = diagnosis.recommendedAgentKey;
  for (const dept of RAI2_DEPARTMENTS) {
    const found = dept.agents.find((a) => a.key === diagnosis.recommendedAgentKey);
    if (found) {
      recommendedAgentName = found.name;
      break;
    }
  }

  const handleActivateAgent = () => {
    if (onSelectAgentKey) {
      onSelectAgentKey(diagnosis.recommendedAgentKey);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] max-w-4xl bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Gauge className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id={dialogTitleId} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Bộ Bắt Điểm Nghẽn TOC & Giả Lập 5 Đòn Bẩy P&L
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  Theory of Constraints
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tìm đúng điểm nghẽn duy nhất và khóa van lãng phí ngân sách trước khi triển khai AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body - 2 Columns on Desktop, Vertical on Mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 4 Diagnostic Sliders (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              1. Khảo Sát Tải Vận Hành (4 Chỉ Số)
            </div>

            {/* Delivery Capacity */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>Công suất thi công/giao hàng:</span>
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded-md",
                  deliveryCapacity > 85 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400" : "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                )}>
                  {deliveryCapacity}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={deliveryCapacity}
                onChange={(e) => setDeliveryCapacity(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Dư sức (20%)</span>
                <span>An toàn (75%)</span>
                <span className="text-rose-500 font-semibold">Quá tải (&gt;85%)</span>
              </div>
            </div>

            {/* Quote Turnaround Days */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>Thời gian phản hồi báo giá:</span>
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded-md",
                  quoteDays >= 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                )}>
                  {quoteDays} ngày
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={quoteDays}
                onChange={(e) => setQuoteDays(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Cực nhanh (&le;1 ngày)</span>
                <span>Bình thường (2 ngày)</span>
                <span className="text-amber-500 font-semibold">Chậm (&ge;3 ngày)</span>
              </div>
            </div>

            {/* Owner Time Sink */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>Thời gian chủ làm việc sự vụ:</span>
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded-md",
                  ownerHours >= 10 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}>
                  {ownerHours}h / tuần
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={2}
                value={ownerHours}
                onChange={(e) => setOwnerHours(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Tự hành (&lt;5h)</span>
                <span>Vừa phải (8h)</span>
                <span className="text-rose-500 font-semibold">MeOS Trap (&ge;10h)</span>
              </div>
            </div>

            {/* Backlog Toggle, Revenue & Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Tồn đọng &gt;48h:
                </span>
                <button
                  type="button"
                  onClick={() => setHasBacklog(!hasBacklog)}
                  className={cn(
                    "mt-2 py-1 px-2.5 rounded-lg text-xs font-bold transition-all text-center",
                    hasBacklog
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {hasBacklog ? "CÓ TỒN ĐỌNG" : "KHÔNG"}
                </button>
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Doanh thu (Tr.đ):
                </span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  step={50}
                  value={revenueMillion}
                  onChange={(e) => setRevenueMillion(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Biên LN ròng (%):
                </span>
                <input
                  type="number"
                  min={5}
                  max={80}
                  step={1}
                  value={netMargin}
                  onChange={(e) => setNetMargin(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column: TOC Diagnosis & 5-Lever P&L Flywheel (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                2. Kết Quả Định Vị Điểm Nghẽn & Khuyến Nghị
              </div>

              {/* Upstream Gate Warning if Clogged */}
              {diagnosis.upstreamBlockWarning && (
                <div className="p-3.5 rounded-2xl border border-rose-300 bg-rose-50/90 dark:border-rose-900/60 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-pulse">
                  <ShieldAlert className="size-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cảnh Báo Khóa Van Tiếp Thị (Upstream Gate): </span>
                    <span>{diagnosis.upstreamBlockWarning}</span>
                  </div>
                </div>
              )}

              {/* Constraint Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                    Zone {diagnosis.zoneNumber}: {diagnosis.departmentName}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-md",
                    diagnosis.urgencyLevel === "CRITICAL" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  )}>
                    {diagnosis.urgencyLevel}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {diagnosis.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {diagnosis.description}
                </p>
                <div className="mt-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                  {diagnosis.symptomExplanation}
                </div>
              </div>

              {/* 5-Lever P&L Compounding Flywheel */}
              <div className="p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30 bg-sky-50/40 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                    <TrendingUp className="size-4" />
                    <span>Mô Hình 5 Đòn Bẩy Tài Chính P&L (Compounding Flywheel)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                    Chuẩn sách The AI First Company
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">L1: Lead Growth</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      +{diagnosis.levers.lever1MarketingLeadGrowth}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">L2: Nén Thời Gian</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      +{diagnosis.levers.lever2TurnaroundCompressionRatio}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">L3: Giảm Lỗi Sai</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{(diagnosis.levers.lever3ErrorReductionCost / 1_000_000).toFixed(0)} Tr.đ
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium">L4: Biên LN Ròng</div>
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                      &ge;{diagnosis.levers.projectedNetMargin}%
                    </div>
                  </div>
                </div>

                {/* Projected Profit & Flywheel Reinvestment */}
                <div className="pt-2 border-t border-sky-200/50 dark:border-sky-800/50 flex flex-wrap items-center justify-between text-xs gap-2">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Doanh thu dự phóng: </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {(diagnosis.levers.projectedMonthlyRevenue / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Lợi nhuận ròng: </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(diagnosis.levers.projectedMonthlyProfit / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div className="w-full text-[11px] text-slate-500 dark:text-slate-400">
                    Trích L5 (Tái đầu tư 30% lợi nhuận mới):{" "}
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      +{(diagnosis.levers.lever5ReinvestmentPool / 1_000_000).toFixed(1)} Tr.đ
                    </span>{" "}
                    vào ngân sách data và quảng cáo tháng sau.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action: 1-Click Activate Recommended Agent */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleActivateAgent}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                <span>Kích Hoạt Nhân Sự Giải Phóng Điểm Nghẽn: {recommendedAgentName}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
