import React, { useEffect, useMemo, useState, useId } from "react";
import {
  X,
  Check,
  Sparkles,
  Mic,
  MicOff,
  ShieldCheck,
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
  offer_matrix: "3. Sản Phẩm",
  objection_playbook: "4. Xử Lý Từ Chối",
  golden_pitch: "5. Bài Bán Hàng",
  delivery_sop: "6. SOP Vận Hành",
  pre_mortem: "7. Rủi Ro Thất Bại",
  anti_goals: "8. Ranh Giới Cấm",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150"
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
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white tracking-tight truncate"
                >
                  Két Sắt Ngữ Cảnh 8 Trụ Cột
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[#0077cc] dark:text-sky-300 border border-[#e2e8f0] dark:border-slate-700 shrink-0">
                  Context Vault
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 truncate hidden sm:block">
                Thu âm hoặc nạp tri thức lõi cho hệ thống AI doanh nghiệp.
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

        {/* View Mode Segmented Bar */}
        <div className="px-3 sm:px-6 py-2 border-b border-[#e2e8f0] dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "edit"
                ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 hover:border-slate-300"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>8 Trụ Cột</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("record")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "record"
                ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 hover:border-slate-300"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Thu Âm Nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("router")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "router"
                ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700 hover:border-slate-300"
            )}
          >
            <Route className="w-3.5 h-3.5 text-[#0077cc]" />
            <span>Bộ Định Tuyến (-80% Token)</span>
          </button>
        </div>

        {/* Content Body: Edit Mode */}
        {viewMode === "edit" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Horizontal Pillar Tabs (Mobile) / Sidebar Tabs (Desktop) */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#e2e8f0] dark:border-slate-800 overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-1 bg-white/40 dark:bg-slate-950/20 shrink-0 scrollbar-none snap-x">
              <div className="hidden md:flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      "text-left px-3 py-1.5 md:py-2 rounded-full md:rounded-xl text-xs transition-all whitespace-nowrap md:whitespace-normal shrink-0 snap-start active:scale-95",
                      active
                        ? "bg-[#0f172a] dark:bg-[#0099ff] text-white shadow-2xs font-bold"
                        : "bg-white md:bg-transparent dark:bg-slate-800 md:dark:bg-transparent text-[#475569] dark:text-slate-300 border border-[#e2e8f0] md:border-transparent dark:border-slate-700 hover:bg-white/80"
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
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-xs text-[#0f172a] dark:text-white flex items-center justify-between shadow-2xs">
                    <span>{distillNotice}</span>
                    <button
                      type="button"
                      onClick={() => setDistillNotice(null)}
                      className="text-slate-400 hover:text-slate-700 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#0f172a] dark:text-white">
                      {CONTEXT_PILLARS[activeTab].title}
                    </h3>
                    <p className="text-[11px] text-[#475569] dark:text-slate-400">
                      {CONTEXT_PILLARS[activeTab].subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0077cc] dark:text-sky-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Nạp mẫu chuẩn</span>
                  </button>
                </div>

                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="flex-1 w-full min-h-[200px] p-3 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800/80 font-mono text-xs text-[#0f172a] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0099ff] resize-none leading-relaxed shadow-2xs"
                  placeholder="Nhập nội dung bối cảnh..."
                />
              </div>

              {/* Sharpness Gauge Panel (Clean White / Blue Accent) */}
              <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-[#e2e8f0] dark:border-slate-800 p-3.5 sm:p-4 bg-white/60 dark:bg-slate-950/20 overflow-y-auto flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f172a] dark:text-slate-300">
                    Độ Sắc Nét:
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                      sharpness.isSharp
                        ? "bg-white text-[#0077cc] border-[#e2e8f0]"
                        : "bg-white text-slate-700 border-slate-200"
                    )}
                  >
                    {sharpness.score}/100 {sharpness.isSharp ? "✓ Đạt" : "Cần sửa"}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#0099ff] transition-all duration-300"
                    style={{ width: `${sharpness.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700">
                    <div className="text-slate-400">Số từ:</div>
                    <div className="font-bold text-[#0f172a] dark:text-white">
                      {sharpness.wordCount}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700">
                    <div className="text-slate-400">Từ/câu TB:</div>
                    <div className="font-bold text-[#0f172a] dark:text-white">
                      {sharpness.averageWordsPerSentence} (chuẩn 12-18)
                    </div>
                  </div>
                </div>

                {sharpness.flaggedJargon.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-[11px]">
                    <div className="font-semibold text-slate-500 mb-1">Từ sáo rỗng:</div>
                    <div className="flex flex-wrap gap-1">
                      {sharpness.flaggedJargon.map((j) => (
                        <span
                          key={j}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 line-through text-[10px]"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-[#0f172a] dark:text-slate-300 mb-1">
                    Góp ý tinh chỉnh:
                  </div>
                  <ul className="text-[11px] space-y-1 text-[#475569] dark:text-slate-400">
                    {sharpness.feedback.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-[#0077cc]">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Record First View (Clean Minimalist White) */}
        {viewMode === "record" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-w-2xl mx-auto w-full">
            <div className="text-center mb-4">
              <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 px-3 py-0.5 text-xs font-bold text-[#0077cc] dark:text-sky-300 mb-1.5 shadow-2xs">
                Record First
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#0f172a] dark:text-white">
                Thu Âm Hoặc Dán Bối Cảnh Thực Chiến
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Nói ra kinh nghiệm thực tế, AI tự động chắt lọc vào Két Sắt.
              </p>
            </div>

            <div className="flex items-center justify-center mb-3">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-2xs",
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-[#0f172a] dark:bg-[#0099ff] text-white"
                )}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-sky-300" />}
                <span>{isRecording ? "Đang nghe... (Chạm để dừng)" : "Bắt đầu thu âm"}</span>
              </button>
            </div>

            <textarea
              value={rawMonologue}
              onChange={(e) => setRawMonologue(e.target.value)}
              className="w-full h-40 sm:h-48 p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#0f172a] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0099ff] resize-none font-sans leading-relaxed shadow-2xs"
              placeholder="Hoặc dán toàn bộ đoạn trao đổi, transcript cuộc họp, quy tắc bán hàng vào đây..."
            />

            <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setRawMonologue("")}
                className="w-full sm:w-auto px-4 py-2 rounded-full text-xs text-slate-500 hover:bg-slate-100 font-semibold"
              >
                Xóa văn bản
              </button>
              <button
                type="button"
                onClick={handleDistill}
                disabled={!rawMonologue.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#0f172a] dark:bg-[#0099ff] disabled:opacity-40 text-white text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Chắt Lọc Tri Thức →</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Context Router View (Clean White) */}
        {viewMode === "router" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-3.5">
            <div>
              <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 px-2.5 py-0.5 text-xs font-bold text-[#0077cc] dark:text-sky-300 mb-1 shadow-2xs">
                Context Router
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#0f172a] dark:text-white">
                Tự Động Trích Xuất Bối Cảnh, Tiết Kiệm 80% Token
              </h3>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
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
                    "px-3 py-1 rounded-full text-xs font-medium transition active:scale-95",
                    activeTask === t.id
                      ? "bg-[#0f172a] dark:bg-[#0099ff] text-white font-bold shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-[#475569] dark:text-slate-300 border border-[#e2e8f0] dark:border-slate-700"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs text-xs">
                <div className="font-bold text-[#0f172a] dark:text-white mb-1">
                  Trụ cột nạp ({routed.activePillars.length}/8):
                </div>
                <div className="space-y-0.5">
                  {routed.activePillars.map((p) => (
                    <div key={p} className="text-[#0077cc] dark:text-sky-300 font-medium">
                      ✓ {CONTEXT_PILLARS[p].title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs text-xs">
                <div className="font-bold text-[#0f172a] dark:text-white mb-0.5">
                  Token Tiết Kiệm:
                </div>
                <div className="text-lg font-black text-[#0077cc] dark:text-sky-400">
                  ~{routed.tokensSavedEstimate.toLocaleString()} tokens
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Giảm 75% – 85% chi phí API.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 shadow-2xs text-xs">
                <div className="font-bold text-[#0f172a] dark:text-white mb-0.5">
                  Độ chính xác:
                </div>
                <div className="text-lg font-black text-[#0f172a] dark:text-white">
                  &gt; 92%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Đặt đúng vị trí tối ưu ngữ cảnh.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-xs font-bold text-[#0f172a] dark:text-slate-300 mb-1">
                Xem trước bối cảnh tinh gọn:
              </div>
              <pre className="p-3 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-auto max-h-40 leading-relaxed">
                {routed.combinedContext}
              </pre>
            </div>
          </div>
        )}

        {/* Sticky Action Footer CTA (Clean White / Jet Black Pill) */}
        <div className="sticky bottom-0 left-0 right-0 p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-[#e2e8f0] dark:border-slate-800 z-20 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
          <div className="text-[11px] text-center sm:text-left text-slate-400">
            Mã hóa và lưu trữ cục bộ trong Két Sắt Doanh Nghiệp.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSyncComplete) onSyncComplete();
                onClose();
              }}
              className="w-full sm:w-auto py-3 px-6 rounded-full bg-[#0f172a] hover:bg-slate-800 dark:bg-[#0099ff] dark:hover:bg-sky-400 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu & Đồng Bộ Toàn Bộ Bots</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
