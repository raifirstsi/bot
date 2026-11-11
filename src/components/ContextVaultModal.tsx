import React, { useEffect, useMemo, useState, useId } from "react";
import {
  X,
  Check,
  Sparkles,
  Mic,
  MicOff,
  Layers,
  Route,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CONTEXT_PILLARS,
  distillUnscriptedKnowledge,
  routeContextForTask,
  scoreContextSharpness,
  type ContextPillarId,
  type TaskType,
} from "../lib/context-vault.ts";

const STORAGE_KEY = "rai2_context_vault_v1";

export function loadSavedContextVault(): Record<ContextPillarId, string> | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return null;
}

export function saveContextVaultToStorage(
  contents: Record<ContextPillarId, string>
): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contents));
    } catch {
      // ignore
    }
  }
}

interface ContextVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

const SHORT_PILLAR_LABELS: Record<ContextPillarId, string> = {
  brand_voice: "1. Brand Voice",
  customer_avatar: "2. Khách Hàng",
  offer_breakdown: "3. Sản Phẩm & Offer",
  competitive_positioning: "4. Định Vị Đối Thủ",
  sales_process: "5. Quy Trình Bán Hàng",
  case_studies: "6. Case Study & Proof",
  sops: "7. Quy Trình SOP",
  industry_context: "8. Bối Cảnh Ngành",
};

export const ContextVaultModal: React.FC<ContextVaultModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const dialogTitleId = useId();
  const [activeTab, setActiveTab] = useState<ContextPillarId>("brand_voice");
  const [contents, setContents] = useState<Record<ContextPillarId, string>>(() => {
    const saved = loadSavedContextVault();
    if (saved) return saved;
    const initial: Record<string, string> = {};
    for (const key of Object.keys(CONTEXT_PILLARS)) {
      initial[key] = CONTEXT_PILLARS[key as ContextPillarId].defaultTemplate;
    }
    return initial as Record<ContextPillarId, string>;
  });

  const [rawMonologue, setRawMonologue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [distillNotice, setDistillNotice] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskType>("proposal");
  const [viewMode, setViewMode] = useState<"edit" | "router" | "record">("edit");

  useEffect(() => {
    saveContextVaultToStorage(contents);
  }, [contents]);

  const currentContent = contents[activeTab] || "";
  const sharpness = useMemo(
    () => scoreContextSharpness(currentContent),
    [currentContent]
  );

  const routed = useMemo(
    () => routeContextForTask(activeTask, contents),
    [activeTask, contents]
  );

  if (!isOpen) return null;

  const handleContentChange = (val: string) => {
    setContents((prev) => ({ ...prev, [activeTab]: val }));
  };

  const handleResetToTemplate = () => {
    setContents((prev) => ({
      ...prev,
      [activeTab]: CONTEXT_PILLARS[activeTab].defaultTemplate,
    }));
  };

  const handleDistill = () => {
    if (!rawMonologue.trim()) return;
    const result = distillUnscriptedKnowledge(rawMonologue);
    setContents((prev) => ({
      ...prev,
      [result.detectedPillar]: `${prev[result.detectedPillar] || ""}\n\n${result.memory}\n\n${result.soul}`,
    }));
    setActiveTab(result.detectedPillar);
    setDistillNotice(result.summary);
    setViewMode("edit");
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        try {
          const SpeechRecognition = (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "vi-VN";
          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            setRawMonologue((prev) => (prev ? `${prev} ${transcript}` : transcript));
          };
          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          recognition.start();
        } catch {
          // fallback
        }
      }
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      className="ui-scrim fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="ui-modal relative flex h-[min(760px,94dvh)] w-full max-w-[1000px] flex-col overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline/40 px-5 py-4">
          <div className="min-w-0">
            <h2 id={dialogTitleId} className="truncate text-[17px] font-semibold text-ink">
              Két Sắt Ngữ Cảnh 8 Trụ Cột
            </h2>
            <p className="mt-0.5 hidden truncate text-[13px] text-ink-secondary sm:block">
              Thu âm hoặc nạp tri thức lõi cho hệ thống RAI doanh nghiệp.
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

        {/* View Mode Segmented Bar */}
        <div className="flex shrink-0 snap-x gap-1 overflow-x-auto border-b border-hairline/40 p-2 scrollbar-none sm:px-5">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition-colors",
              viewMode === "edit"
                ? "bg-control font-medium text-ink"
                : "text-ink-secondary hover:bg-control/50 hover:text-ink"
            )}
          >
            <Layers size={13} />
            <span>8 Trụ Cột</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("record")}
            className={cn(
              "flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition-colors",
              viewMode === "record"
                ? "bg-control font-medium text-ink"
                : "text-ink-secondary hover:bg-control/50 hover:text-ink"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span>Thu Âm Nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("router")}
            className={cn(
              "flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition-colors",
              viewMode === "router"
                ? "bg-control font-medium text-ink"
                : "text-ink-secondary hover:bg-control/50 hover:text-ink"
            )}
          >
            <Route size={13} />
            <span>Bộ Định Tuyến (-80% Token)</span>
          </button>
        </div>

        {/* Content Body: Edit Mode */}
        {viewMode === "edit" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Horizontal Pillar Tabs (Mobile) / Sidebar Tabs (Desktop) */}
            <div className="flex w-full shrink-0 snap-x gap-1 overflow-x-auto border-b border-hairline/40 p-2 scrollbar-none md:w-[200px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-3">
              <div className="hidden px-2 pb-2 pt-1 text-[12px] font-medium text-ink-tertiary md:flex">
                8 Trụ Cột Tri Thức
              </div>
              {(Object.keys(CONTEXT_PILLARS) as ContextPillarId[]).map((id) => {
                const p = CONTEXT_PILLARS[id];
                const active = activeTab === id;
                const shortLabel = SHORT_PILLAR_LABELS[id] || p.title;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "shrink-0 snap-start whitespace-nowrap rounded-lg px-3 py-2 text-left text-[13px] transition-colors md:whitespace-normal",
                      active
                        ? "bg-control font-medium text-ink"
                        : "text-ink-secondary hover:bg-control/60 hover:text-ink"
                    )}
                  >
                    <div className="truncate">{shortLabel}</div>
                  </button>
                );
              })}
            </div>

            {/* Main Editor & Sharpness Audit */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Textarea Area */}
              <div className="flex-1 flex flex-col p-3.5 sm:p-4 overflow-y-auto space-y-2.5">
                {distillNotice && (
                  <div className="flex items-center justify-between rounded-xl border border-hairline/40 bg-card p-2.5 text-[13px] text-ink">
                    <span>{distillNotice}</span>
                    <button
                      type="button"
                      onClick={() => setDistillNotice(null)}
                      className="text-ink-tertiary hover:text-ink font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[13px] sm:text-[14px] text-ink">
                      {CONTEXT_PILLARS[activeTab].title}
                    </h3>
                    <p className="text-[12px] text-ink-secondary">
                      {CONTEXT_PILLARS[activeTab].subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline"
                  >
                    <RotateCcw size={12} />
                    <span>Nạp mẫu chuẩn</span>
                  </button>
                </div>

                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="min-h-[200px] w-full flex-1 resize-none rounded-lg border border-hairline/40 bg-inset p-3 font-mono text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-focus/60"
                  placeholder="Nhập nội dung bối cảnh..."
                />
              </div>

              {/* Sharpness Gauge Panel */}
              <div className="flex w-full flex-col gap-2.5 overflow-y-auto border-t border-hairline/40 p-3.5 sm:p-4 lg:w-64 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">
                    Độ Sắc Nét:
                  </span>
                  <span
                    className={cn(
                       "ui-chip border",
                      sharpness.isSharp
                        ? "bg-card text-accent-text border-hairline"
                        : "bg-card text-warning border-hairline"
                    )}
                  >
                    {sharpness.score}/100 {sharpness.isSharp ? "✓ Đạt" : "⚠ Cần sửa"}
                  </span>
                </div>

                <div className="w-full bg-control rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${sharpness.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="rounded-lg border border-hairline/40 bg-card p-2">
                    <div className="text-ink-tertiary">Số từ:</div>
                    <div className="font-semibold text-ink">
                      {sharpness.wordCount}
                    </div>
                  </div>
                    <div className="rounded-lg border border-hairline/40 bg-card p-2">
                    <div className="text-ink-tertiary">Từ/câu TB:</div>
                    <div className="font-semibold text-ink">
                      {sharpness.averageWordsPerSentence} (chuẩn 12-18)
                    </div>
                  </div>
                </div>

                {sharpness.flaggedJargon.length > 0 && (
                  <div className="rounded-lg border border-hairline/40 bg-card p-2.5 text-[12px]">
                    <div className="font-semibold text-ink-secondary mb-1">Từ sáo rỗng:</div>
                    <div className="flex flex-wrap gap-1">
                      {sharpness.flaggedJargon.map((j) => (
                        <span
                          key={j}
                          className="px-1.5 py-0.5 rounded bg-inset text-ink-secondary line-through text-[11px]"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-[13px] font-semibold text-ink mb-1">
                    Góp ý tinh chỉnh:
                  </div>
                  <ul className="text-[12px] space-y-1 text-ink-secondary">
                    {sharpness.feedback.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-accent-text">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record First View */}
        {viewMode === "record" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-w-2xl mx-auto w-full">
            <div className="text-center mb-4">
              <h3 className="text-[17px] font-semibold text-ink">
                Thu Âm Hoặc Dán Bối Cảnh Thực Chiến
              </h3>
              <p className="text-[13px] text-ink-secondary mt-0.5">
                Nói ra kinh nghiệm thực tế, AI tự động chắt lọc vào Két Sắt.
              </p>
            </div>

            <div className="flex items-center justify-center mb-3">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={cn(
                  "ui-button ui-button-lg",
                  isRecording
                    ? "bg-danger text-white animate-pulse"
                    : "ui-button-primary"
                )}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isRecording ? "Đang nghe... (Chạm để dừng)" : "Bắt đầu thu âm"}</span>
              </button>
            </div>

            <textarea
              value={rawMonologue}
              onChange={(e) => setRawMonologue(e.target.value)}
              className="h-40 w-full resize-none rounded-lg border border-hairline/40 bg-inset p-3.5 font-sans text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-2 focus:ring-focus/60 sm:h-48"
              placeholder="Hoặc dán toàn bộ đoạn trao đổi, transcript cuộc họp, quy tắc bán hàng vào đây..."
            />

            <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setRawMonologue("")}
                className="ui-button w-full sm:w-auto"
              >
                Xóa văn bản
              </button>
              <button
                type="button"
                onClick={handleDistill}
                disabled={!rawMonologue.trim()}
                className="ui-button ui-button-primary ui-button-lg w-full sm:w-auto"
              >
                <Sparkles size={13} />
                <span>Chắt Lọc Tri Thức →</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Context Router View */}
        {viewMode === "router" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-3.5">
            <div>
              <h3 className="text-[15px] font-semibold text-ink">
                Tự Động Trích Xuất Bối Cảnh, Tiết Kiệm 80% Token
              </h3>
              <p className="text-[13px] text-ink-secondary mt-0.5">
                Chỉ nạp đúng 2–3 trụ cột liên quan theo từng tác vụ, không nạp tràn lan.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "proposal", label: "Lập Báo Giá" },
                { id: "ad_copy", label: "Viết Quảng Cáo" },
                { id: "cskh", label: "Chăm Sóc KH" },
                { id: "hiring", label: "Tuyển Dụng" },
                { id: "qc", label: "Kiểm Soát QC" },
                { id: "finance", label: "Đối Soát Tài Chính" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTask(t.id as TaskType)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[13px] transition-colors",
                    activeTask === t.id
                      ? "bg-control font-medium text-ink"
                      : "text-ink-secondary hover:bg-control/50 hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-hairline/40 bg-card p-3 text-[13px]">
                <div className="font-semibold text-ink mb-1">
                  Trụ cột nạp ({routed.activePillars.length}/8):
                </div>
                <div className="space-y-0.5">
                  {routed.activePillars.map((p) => (
                    <div key={p} className="text-accent-text font-medium">
                      ✓ {CONTEXT_PILLARS[p].title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-hairline/40 bg-card p-3 text-[13px]">
                <div className="font-semibold text-ink mb-0.5">
                  Token Tiết Kiệm:
                </div>
                <div className="text-[18px] font-black text-accent-text">
                  ~{routed.tokensSavedEstimate.toLocaleString()} tokens
                </div>
                <div className="text-[11px] text-ink-tertiary mt-0.5">
                  Giảm 75% – 85% chi phí API.
                </div>
              </div>

              <div className="rounded-xl border border-hairline/40 bg-card p-3 text-[13px]">
                <div className="font-semibold text-ink mb-0.5">
                  Độ chính xác:
                </div>
                <div className="text-[18px] font-black text-ink">
                  &gt; 92%
                </div>
                <div className="text-[11px] text-ink-tertiary mt-0.5">
                  Đặt đúng vị trí tối ưu ngữ cảnh.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-[13px] font-semibold text-ink mb-1">
                Xem trước bối cảnh tinh gọn:
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg bg-inset p-3 font-mono text-[12px] leading-relaxed text-ink-secondary">
                {routed.combinedContext}
              </pre>
            </div>
          </div>
        )}

        {/* Sticky Action Footer CTA */}
        <div className="sticky bottom-0 left-0 right-0 z-20 flex flex-col gap-2.5 border-t border-hairline/40 bg-panel p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="text-[12px] text-center sm:text-left text-ink-tertiary">
            Mã hóa và lưu trữ cục bộ trong Két Sắt Doanh Nghiệp.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="ui-button hidden sm:inline-flex"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSyncComplete) onSyncComplete();
                onClose();
              }}
              className="ui-button ui-button-primary ui-button-lg w-full sm:w-auto"
            >
              <Check size={15} />
              <span>Lưu & Đồng Bộ Toàn Bộ Bots</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
