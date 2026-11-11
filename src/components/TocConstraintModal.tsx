import { useState, useId } from "react";
import {
  X,
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
              Bộ Bắt Điểm Nghẽn TOC
            </h2>
            <p className="mt-0.5 hidden truncate text-[13px] text-ink-secondary sm:block">
              Tìm điểm nghẽn duy nhất và mô phỏng 5 đòn bẩy P&amp;L.
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

        {/* Mobile Tab: Khảo Sát vs Kết Quả (Hidden on lg+) */}
        <div className="flex shrink-0 gap-1 border-b border-hairline/40 p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("input")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
              mobileTab === "input"
                ? "bg-control font-medium text-ink"
                : "text-ink-secondary hover:bg-control/50 hover:text-ink"
            )}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Khảo Sát</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("result")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
              mobileTab === "result"
                ? "bg-control font-medium text-ink"
                : "text-ink-secondary hover:bg-control/50 hover:text-ink"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2. Kết Quả P&L</span>
          </button>
        </div>

        {/* Content Body - 2 Columns on Desktop, Tabbed on Mobile */}
        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 sm:p-5 lg:grid-cols-12">
          {/* Left Column: 4 Diagnostic Sliders */}
          <div
            className={cn(
              "lg:col-span-5 space-y-3",
              mobileTab === "input" ? "block" : "hidden lg:block"
            )}
          >
            <div className="mb-0.5 text-[12px] font-medium text-ink-tertiary">
              1. Khảo Sát Tải Vận Hành (4 Chỉ Số)
            </div>

            {/* Delivery Capacity */}
            <div className="rounded-xl border border-hairline/40 bg-card p-3.5">
              <div className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-ink">
                <span>Công suất thi công/giao hàng:</span>
                <span className="text-[13px] font-medium text-ink-secondary">
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
                className="h-1.5 w-full cursor-pointer accent-accent"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-tertiary">
                <span>Dư sức (20%)</span>
                <span>An toàn (75%)</span>
                <span>Quá tải (&gt;85%)</span>
              </div>
            </div>

            {/* Quote Turnaround Days */}
            <div className="rounded-xl border border-hairline/40 bg-card p-3.5">
              <div className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-ink">
                <span>Thời gian phản hồi báo giá:</span>
                <span className="text-[13px] font-medium text-ink-secondary">
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
                className="h-1.5 w-full cursor-pointer accent-accent"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-tertiary">
                <span>Nhanh (≤1 ngày)</span>
                <span>Chuẩn (2 ngày)</span>
                <span>Chậm (≥3 ngày)</span>
              </div>
            </div>

            {/* Owner Time Sink */}
            <div className="rounded-xl border border-hairline/40 bg-card p-3.5">
              <div className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-ink">
                <span>Thời gian chủ làm sự vụ:</span>
                <span className="text-[13px] font-medium text-ink-secondary">
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
                className="h-1.5 w-full cursor-pointer accent-accent"
              />
              <div className="mt-1 flex justify-between text-[10px] text-ink-tertiary">
                <span>Tự hành (&lt;5h)</span>
                <span>Vừa phải (8h)</span>
                <span>Bị kẹt (&ge;10h)</span>
              </div>
            </div>

            {/* Backlog, Revenue & Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col justify-between rounded-xl border border-hairline/40 bg-card p-2.5">
                <span className="text-[10px] font-medium text-ink-secondary">
                  Tồn đọng &gt;48h:
                </span>
                <button
                  type="button"
                  onClick={() => setHasBacklog(!hasBacklog)}
                  className={cn(
                    "mt-1.5 rounded-lg px-2.5 py-1.5 text-center text-[12px] font-medium transition-colors",
                    hasBacklog
                      ? "bg-ink text-panel"
                      : "bg-control text-ink-secondary"
                  )}
                >
                  {hasBacklog ? "CÓ TỒN ĐỌNG" : "KHÔNG"}
                </button>
              </div>

              <div className="rounded-xl border border-hairline/40 bg-card p-2.5">
                <span className="mb-1 block text-[10px] font-medium text-ink-secondary">
                  Doanh thu (Tr.đ):
                </span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  step={50}
                  value={revenueMillion}
                  onChange={(e) => setRevenueMillion(Number(e.target.value))}
                  className="w-full rounded-lg border border-hairline/40 bg-inset px-2.5 py-1 text-[12px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-focus/60"
                />
              </div>

              <div className="rounded-xl border border-hairline/40 bg-card p-2.5">
                <span className="mb-1 block text-[10px] font-medium text-ink-secondary">
                  Biên LN ròng (%):
                </span>
                <input
                  type="number"
                  min={5}
                  max={80}
                  step={1}
                  value={netMargin}
                  onChange={(e) => setNetMargin(Number(e.target.value))}
                  className="w-full rounded-lg border border-hairline/40 bg-inset px-2.5 py-1 text-[12px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-focus/60"
                />
              </div>
            </div>

            {/* Mobile Switch to Result Button */}
            <div className="lg:hidden pt-1">
              <button
                type="button"
                onClick={() => setMobileTab("result")}
                className="ui-button ui-button-primary ui-button-lg w-full"
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
              <div className="mb-0.5 flex items-center justify-between text-[12px] font-medium text-ink-tertiary">
                <span>2. Điểm Nghẽn & Khuyến Nghị</span>
                <button
                  type="button"
                  onClick={() => setMobileTab("input")}
                  className="text-[12px] font-medium text-accent-text hover:underline lg:hidden"
                >
                  ← Chỉnh 4 chỉ số
                </button>
              </div>

              {/* Upstream Gate Warning */}
              {diagnosis.upstreamBlockWarning && (
                <div className="flex items-start gap-2 rounded-xl border border-hairline/40 bg-card p-3 text-[13px] text-ink">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ink-secondary" />
                  <div>
                    <span className="font-bold">Khóa Van Tiếp Thị: </span>
                    <span className="text-ink-secondary">{diagnosis.upstreamBlockWarning}</span>
                  </div>
                </div>
              )}

              {/* Constraint Card (Pure White Card with Hairline Border) */}
              <div className="rounded-xl border border-hairline/40 bg-card p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="ui-chip bg-control text-ink-secondary">
                    Vùng {diagnosis.zoneNumber}: {diagnosis.departmentName}
                  </span>
                  <span className="text-[12px] text-ink-tertiary">·</span>
                  <span className="text-[11px] font-medium text-ink-secondary">
                    {diagnosis.urgencyLevel}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-ink">
                  {diagnosis.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
                  {diagnosis.description}
                </p>
                <div className="mt-2 rounded-lg bg-inset p-2.5 text-[12px] text-ink-secondary">
                  {diagnosis.symptomExplanation}
                </div>
              </div>

              {/* 5-Lever P&L Flywheel (Clean White) */}
              <div className="space-y-2.5 rounded-xl border border-hairline/40 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                    <TrendingUp className="size-4 text-ink-secondary" />
                    <span>5 Đòn Bẩy P&L</span>
                  </div>
                  <span className="text-[10px] text-ink-tertiary">
                    Mô hình nén chi phí & tăng biên
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-inset p-2">
                    <div className="text-[10px] text-ink-tertiary">L1: Lead Growth</div>
                    <div className="mt-0.5 text-[12px] font-medium text-ink">
                      +{diagnosis.levers.lever1MarketingLeadGrowth}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-inset p-2">
                    <div className="text-[10px] text-ink-tertiary">L2: Nén Time</div>
                    <div className="mt-0.5 text-[12px] font-medium text-ink">
                      +{diagnosis.levers.lever2TurnaroundCompressionRatio}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-inset p-2">
                    <div className="text-[10px] text-ink-tertiary">L3: Giảm Lỗi</div>
                    <div className="mt-0.5 text-[12px] font-medium text-ink">
                      +{(diagnosis.levers.lever3ErrorReductionCost / 1_000_000).toFixed(0)} Tr.đ
                    </div>
                  </div>
                  <div className="rounded-lg bg-inset p-2">
                    <div className="text-[10px] text-ink-tertiary">L4: Biên Ròng</div>
                    <div className="mt-0.5 text-[12px] font-medium text-ink">
                      &ge;{diagnosis.levers.projectedNetMargin}%
                    </div>
                  </div>
                </div>

                {/* Projected Profit & Flywheel Reinvestment */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-hairline/40 pt-2 text-[12px]">
                  <div>
                    <span className="text-ink-tertiary">Doanh thu dự phóng: </span>
                    <span className="font-medium text-ink">
                      {(diagnosis.levers.projectedMonthlyRevenue / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-tertiary">Lợi nhuận ròng: </span>
                    <span className="font-medium text-ink">
                      {(diagnosis.levers.projectedMonthlyProfit / 1_000_000).toFixed(0)} Tr.đ/tháng
                    </span>
                  </div>
                  <div className="w-full text-[10px] text-ink-tertiary">
                    Tái đầu tư L5:{" "}
                    <span className="font-medium text-ink">
                      +{(diagnosis.levers.lever5ReinvestmentPool / 1_000_000).toFixed(1)} Tr.đ
                    </span>{" "}
                    vào ngân sách data và quảng cáo.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action: 1-Click Activate Recommended Agent */}
            <div className="border-t border-hairline/40 pt-3">
              <button
                type="button"
                onClick={handleActivateAgent}
                className="ui-button ui-button-primary ui-button-lg w-full"
              >
                <Sparkles className="size-3.5" />
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
