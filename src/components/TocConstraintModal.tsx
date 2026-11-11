import { useState, useId } from "react";
import {
  X,
  Gauge,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sliders,
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

  const [deliveryCapacity, setDeliveryCapacity] = useState<number>(75);
  const [quoteDays, setQuoteDays] = useState<number>(4);
  const [ownerHours, setOwnerHours] = useState<number>(12);
  const [hasBacklog, setHasBacklog] = useState<boolean>(true);
  const [revenueMillion, setRevenueMillion] = useState<number>(350);
  const [netMargin, setNetMargin] = useState<number>(20);

  const [mobileTab, setMobileTab] = useState<"input" | "result">("input");

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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[90vh] sm:max-w-5xl bg-[#f8fafd] dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-[#e2e8f0] dark:border-slate-800 flex flex-col overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(0, 153, 255, 0.08) 0%, rgba(0, 153, 255, 0.02) 40%, transparent 65%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header (56px Minimalist White) */}
        <div className="h-14 px-4 sm:px-6 border-b border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0077cc] dark:text-sky-300 flex items-center justify-center shrink-0 border border-[#e2e8f0] dark:border-slate-700">
              <Gauge className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tracking-tight truncate"
                >
                  Bắt Điểm Nghẽn TOC & 5 Đòn Bẩy P&L
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[#0077cc] dark:text-sky-300 border border-[#e2e8f0] dark:border-slate-700 shrink-0">
                  TOC Engine
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 truncate hidden sm:block">
                Tìm đúng điểm nghẽn duy nhất và khóa van lãng phí ngân sách trước khi triển khai AI.
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

        {/* Mobile Tab: Khảo Sát vs Kết Quả (Hidden on lg+) */}
        <div className="lg:hidden border-b border-[#e2e8f0] dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 px-3 py-2 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("input")}
            className={cn(
              "flex-1 py-1 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95",
              mobileTab === "input"
                ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Khảo Sát</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("result")}
            className={cn(
              "flex-1 py-1 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95",
              mobileTab === "result"
                ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Kết Quả P&L</span>
          </button>
        </div>

        {/* Content Body - 2 Columns on Desktop, Tabbed on Mobile */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: 4 Diagnostic Sliders */}
          <div
            className={cn(
              "lg:col-span-5 space-y-3",
              mobileTab === "input" ? "block" : "hidden lg:block"
            )}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              1. Khảo Sát Tải Vận Hành (4 Chỉ Số)
            </div>

            {/* Delivery Capacity */}
            <div className="p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                <span>Công suất thi công/giao hàng:</span>
                <span className="font-bold text-xs text-[#0077cc] dark:text-sky-300">
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
                className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>Dư sức (20%)</span>
                <span>An toàn (75%)</span>
                <span>Quá tải (&gt;85%)</span>
              </div>
            </div>

            {/* Quote Turnaround Days */}
            <div className="p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                <span>Thời gian phản hồi báo giá:</span>
                <span className="font-bold text-xs text-[#0077cc] dark:text-sky-300">
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
                className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>Nhanh (≤1 ngày)</span>
                <span>Chuẩn (2 ngày)</span>
                <span>Chậm (≥3 ngày)</span>
              </div>
            </div>

            {/* Owner Time Sink */}
            <div className="p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                <span>Thời gian chủ làm sự vụ:</span>
                <span className="font-bold text-xs text-[#0077cc] dark:text-sky-300">
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
                className="w-full accent-[#0099ff] cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>Tự hành (&lt;5h)</span>
                <span>Vừa phải (8h)</span>
                <span>Bị kẹt (&ge;10h)</span>
              </div>
            </div>

            {/* Backlog, Revenue & Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-slate-500">
                  Tồn đọng &gt;48h:
                </span>
                <button
                  type="button"
                  onClick={() => setHasBacklog(!hasBacklog)}
                  className={cn(
                    "mt-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all text-center active:scale-95",
                    hasBacklog
                      ? "bg-[#0f172a] dark:bg-[#0099ff] text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {hasBacklog ? "CÓ TỒN ĐỌNG" : "KHÔNG"}
                </button>
              </div>

              <div className="p-2.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Doanh thu (Tr.đ):
                </span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  step={50}
                  value={revenueMillion}
                  onChange={(e) => setRevenueMillion(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-[#0f172a] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0099ff]"
                />
              </div>

              <div className="p-2.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Biên LN ròng (%):
                </span>
                <input
                  type="number"
                  min={5}
                  max={80}
                  step={1}
                  value={netMargin}
                  onChange={(e) => setNetMargin(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-[#0f172a] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0099ff]"
                />
              </div>
            </div>

            {/* Mobile Switch to Result Button */}
            <div className="lg:hidden pt-1">
              <button
                type="button"
                onClick={() => setMobileTab("result")}
                className="w-full py-2.5 rounded-full bg-[#0f172a] text-white dark:bg-[#0099ff] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Xem Kết Quả Điểm Nghẽn & P&L</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: TOC Diagnosis & 5-Lever P&L Flywheel */}
          <div
            className={cn(
              "lg:col-span-7 space-y-3.5 flex flex-col justify-between",
              mobileTab === "result" ? "block" : "hidden lg:flex"
            )}
          >
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center justify-between">
                <span>2. Điểm Nghẽn & Khuyến Nghị</span>
                <button
                  type="button"
                  onClick={() => setMobileTab("input")}
                  className="lg:hidden text-[11px] text-[#0077cc] font-bold underline"
                >
                  ← Chỉnh 4 chỉ số
                </button>
              </div>

              {/* Upstream Gate Warning */}
              {diagnosis.upstreamBlockWarning && (
                <div className="p-3 rounded-2xl border border-[#e2e8f0] bg-white dark:border-slate-800 dark:bg-slate-900 text-xs text-[#0f172a] dark:text-white flex items-start gap-2 shadow-2xs">
                  <ShieldAlert className="size-4 text-[#0077cc] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Khóa Van Tiếp Thị: </span>
                    <span className="text-[#475569] dark:text-slate-300">{diagnosis.upstreamBlockWarning}</span>
                  </div>
                </div>
              )}

              {/* Constraint Card (Pure White Card with Hairline Border) */}
              <div className="p-4 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0f172a] dark:text-white border border-[#e2e8f0] dark:border-slate-700">
                    Vùng {diagnosis.zoneNumber}: {diagnosis.departmentName}
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-[10px] font-bold text-[#0077cc] dark:text-sky-300">
                    {diagnosis.urgencyLevel}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tracking-tight">
                  {diagnosis.title}
                </h3>
                <p className="text-xs text-[#475569] dark:text-slate-300 mt-1 leading-relaxed">
                  {diagnosis.description}
                </p>
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {diagnosis.symptomExplanation}
                </div>
              </div>

              {/* 5-Lever P&L Flywheel (Clean White) */}
              <div className="p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a] dark:text-white">
                    <TrendingUp className="size-4 text-[#0077cc]" />
                    <span>5 Đòn Bẩy P&L</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Mô hình nén chi phí & tăng biên
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">L1: Lead Growth</div>
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white mt-0.5">
                      +{diagnosis.levers.lever1MarketingLeadGrowth}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">L2: Nén Time</div>
                    <div className="text-xs font-bold text-[#0f172a] dark:text-white mt-0.5">
                      +{diagnosis.levers.lever2TurnaroundCompressionRatio}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">L3: Giảm Lỗi</div>
                    <div className="text-xs font-bold text-[#0077cc] dark:text-sky-300 mt-0.5">
                      +{(diagnosis.levers.lever3ErrorReductionCost / 1_000_000).toFixed(0)} Tr.đ
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">L4: Biên Ròng</div>
                    <div className="text-xs font-bold text-[#0077cc] dark:text-sky-300 mt-0.5">
                      &ge;{diagnosis.levers.projectedNetMargin}%
                    </div>
                  </div>
                </div>

                {/* Projected Profit & Flywheel Reinvestment */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-1.5">
                  <div>
                    <span className="text-slate-400">Doanh thu dự phóng: </span>
                    <span className="font-bold text-[#0f172a] dark:text-white">
                      {(diagnosis.levers.projectedMonthlyRevenue / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lợi nhuận ròng: </span>
                    <span className="font-bold text-[#0077cc] dark:text-sky-300">
                      {(diagnosis.levers.projectedMonthlyProfit / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div className="w-full text-[10px] text-slate-400">
                    Tái đầu tư L5:{" "}
                    <span className="font-bold text-[#0f172a] dark:text-white">
                      +{(diagnosis.levers.lever5ReinvestmentPool / 1_000_000).toFixed(1)} Tr.đ
                    </span>{" "}
                    vào ngân sách data và quảng cáo.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action: 1-Click Activate Recommended Agent */}
            <div className="pt-2 border-t border-[#e2e8f0] dark:border-slate-800">
              <button
                type="button"
                onClick={handleActivateAgent}
                className="w-full py-3 px-5 rounded-full bg-[#0f172a] hover:bg-slate-800 dark:bg-[#0099ff] dark:hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Kích Hoạt Nhân Sự Giải Phóng Điểm Nghẽn: {recommendedAgentName}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
