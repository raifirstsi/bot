import { useMemo, useState } from "react";
import { Check, Edit3, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { validateOutgoingDraft } from "@/lib/silent-error-interceptor";

export interface HitlApprovalPayload {
  taskId: string;
  agentKey: string;
  agentName: string;
  clientName: string;
  dealValue?: string;
  netMarginRate?: number; // e.g. 0.38 for 38%
  actionTitle: string;
  draftContent: string;
  createdAt: string;
  timeoutMinutesRemaining?: number;
}

interface HitlApprovalCardProps {
  payload: HitlApprovalPayload;
  onApprove?: (taskId: string) => void;
  onEdit?: (taskId: string, newContent: string) => void;
  onReject?: (taskId: string) => void;
  className?: string;
}

export function HitlApprovalCard({
  payload,
  onApprove,
  onEdit,
  className,
}: HitlApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(payload.draftContent);
  const [approved, setApproved] = useState(false);

  const validation = useMemo(() => {
    return validateOutgoingDraft({
      id: payload.taskId,
      recipient: payload.clientName,
      channel: "proposal",
      content: editedText,
      quotedPrice: payload.netMarginRate !== undefined ? 100 : undefined,
      costEstimate:
        payload.netMarginRate !== undefined
          ? 100 * (1 - payload.netMarginRate)
          : undefined,
    });
  }, [payload.taskId, payload.clientName, payload.netMarginRate, editedText]);

  const isMarginSafe = (payload.netMarginRate ?? 0.35) >= 0.35;

  if (approved) {
    return (
      <div className={cn("p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300", className)}>
        <div className="flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã duyệt và gửi thành công tới <strong>{payload.clientName}</strong>!</span>
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400">0ms độ trễ</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full max-w-xl rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md overflow-hidden text-sm",
      className
    )}>
      {/* Top Banner */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            {payload.agentName}
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs text-slate-500 font-medium">
            Gửi tới: <strong className="text-slate-800 dark:text-slate-200">{payload.clientName}</strong>
          </span>
        </div>

        {payload.timeoutMinutesRemaining !== undefined && (
          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>Còn {payload.timeoutMinutesRemaining}p để duyệt</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Deal Value & Margin Telemetry */}
        {(payload.dealValue || payload.netMarginRate !== undefined) && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
            {payload.dealValue && (
              <div>
                <span className="text-slate-400">Giá trị hợp đồng: </span>
                <span className="font-bold text-slate-900 dark:text-white">{payload.dealValue}</span>
              </div>
            )}
            {payload.netMarginRate !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Biên lãi ròng:</span>
                <span className={cn(
                  "font-bold px-1.5 py-0.5 rounded text-[11px]",
                  isMarginSafe ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-100 text-rose-800"
                )}>
                  {(payload.netMarginRate * 100).toFixed(0)}% {isMarginSafe ? "🟢 (An toàn)" : "🔴 (Dưới 35%)"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message Draft Preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {payload.actionTitle}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Đạt 24 Tiêu Chí An Toàn</span>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-sky-400 dark:border-sky-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {editedText}
            </div>
          )}
        </div>

        {/* Silent Error Interceptor Alert */}
        {validation.violations.length > 0 && (
          <div
            className={cn(
              "p-2.5 rounded-xl border text-[11px] leading-relaxed",
              validation.status === "BLOCKED"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            )}
          >
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {validation.status === "BLOCKED"
                  ? "Silent Error Interceptor (Khóa khẩn cấp):"
                  : "Cảnh báo chất lượng phát hành:"}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {validation.violations.map((v, i) => (
                <li key={i}>{v.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  onEdit?.(payload.taskId, editedText);
                  setApproved(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Lưu & Duyệt Gửi Đi Ngay
              </button>
              <button
                onClick={() => {
                  setEditedText(payload.draftContent);
                  setIsEditing(false);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <button
                disabled={validation.status === "BLOCKED"}
                onClick={() => {
                  setApproved(true);
                  onApprove?.(payload.taskId);
                }}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs shadow-sm hover:shadow flex items-center justify-center gap-1.5 transition-all",
                  validation.status === "BLOCKED"
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white"
                )}
              >
                <Check className="w-4 h-4" />
                {validation.status === "BLOCKED" ? "Đang Bị Chặn Lỗi Ngầm" : "Duyệt Gửi (1-Click)"}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Sửa Nhanh
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
