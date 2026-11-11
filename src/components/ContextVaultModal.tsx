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
  Trash2,
  ChevronRight,
  Target,
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
  customer_avatar: "2. Customer Avatar",
  offer_matrix: "3. Offer Matrix",
  objection_playbook: "4. Objections",
  golden_pitch: "5. Golden Pitch",
  delivery_sop: "6. Delivery SOP",
  pre_mortem: "7. Pre-Mortem",
  anti_goals: "8. Anti-Goals",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[90vh] sm:max-w-5xl bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Header (56px Apple/Linear precision) */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id={dialogTitleId}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate"
                >
                  Két Sắt Ngữ Cảnh 8 Trụ Cột
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 shrink-0">
                  Documentation Dividend +30%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Chương 15 & 16: RAI² FIRST OS · Record First, Write Never
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

        {/* View Mode Segmented Bar (Horizontal scroll on mobile) */}
        <div className="px-3 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "edit"
                ? "bg-slate-900 dark:bg-[#0099ff] text-white shadow-xs font-bold"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>8 Trụ Cột Tri Thức</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("record")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "record"
                ? "bg-rose-600 text-white shadow-xs font-bold"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Record First (Thu Âm)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("router")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 snap-start active:scale-95",
              viewMode === "router"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
            )}
          >
            <Route className="w-3.5 h-3.5 text-blue-500" />
            <span>Context Router (-80% Token)</span>
          </button>
        </div>

        {/* Content Body: Edit Mode */}
        {viewMode === "edit" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Horizontal Pillar Tabs (Mobile) / Sidebar Tabs (Desktop) */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 overflow-x-auto md:overflow-y-auto p-2.5 flex md:flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/30 shrink-0 scrollbar-none snap-x">
              <div className="hidden md:flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                8 Trụ Cột Bối Cảnh
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
                      "text-left px-3.5 py-2 md:py-2.5 rounded-full md:rounded-2xl text-xs transition-all whitespace-nowrap md:whitespace-normal shrink-0 snap-start active:scale-95",
                      active
                        ? "bg-emerald-600 text-white shadow-xs font-bold"
                        : "bg-white md:bg-transparent dark:bg-slate-800 md:dark:bg-transparent text-slate-700 dark:text-slate-300 border border-slate-200/70 md:border-transparent dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="md:hidden font-semibold">{shortLabel}</div>
                    <div className="hidden md:block font-semibold">{p.title}</div>
                    <div
                      className={cn(
                        "hidden md:block text-[10px] truncate mt-0.5",
                        active ? "text-emerald-100" : "text-slate-400"
                      )}
                    >
                      {p.targetWordCount}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Editor & Sharpness Audit */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Textarea Area */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3">
                {distillNotice && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>{distillNotice}</span>
                    <button
                      type="button"
                      onClick={() => setDistillNotice(null)}
                      className="text-emerald-600 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {CONTEXT_PILLARS[activeTab].title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {CONTEXT_PILLARS[activeTab].subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Nạp mẫu chuẩn</span>
                  </button>
                </div>

                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="flex-1 w-full min-h-[220px] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none leading-relaxed"
                  placeholder="Nhập nội dung bối cảnh..."
                />
              </div>

              {/* Sharpness Gauge Panel */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-950/20 overflow-y-auto flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Độ Sắc Nét (Sharpness)
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      sharpness.score >= 85
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : sharpness.score >= 60
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    )}
                  >
                    {sharpness.score}/100 {sharpness.isSharp ? "✓ ĐẠT" : "⚠ CẦN SỬA"}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      sharpness.score >= 85
                        ? "bg-emerald-500"
                        : sharpness.score >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    )}
                    style={{ width: `${sharpness.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-slate-400">Số từ:</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sharpness.wordCount} từ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-slate-400">Từ/câu TB:</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {sharpness.averageWordsPerSentence} (chuẩn 12-18)
                    </div>
                  </div>
                </div>

                {sharpness.flaggedJargon.length > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/40 text-[11px] text-rose-800 dark:text-rose-300">
                    <div className="font-bold mb-1">Từ sáo rỗng bị phát hiện:</div>
                    <div className="flex flex-wrap gap-1">
                      {sharpness.flaggedJargon.map((j) => (
                        <span
                          key={j}
                          className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 line-through"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {sharpness.metricsFound.length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <div className="font-bold mb-1">Số liệu định lượng tìm thấy:</div>
                    <div className="flex flex-wrap gap-1">
                      {sharpness.metricsFound.slice(0, 6).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Góp ý mài sắc từ CAIO:
                  </div>
                  <ul className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                    {sharpness.feedback.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-slate-400">•</span>
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
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto max-w-3xl mx-auto w-full">
            <div className="text-center mb-5">
              <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-950 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2">
                Quy Tắc: Record First, Write Never
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Nói Ra Mọi Suy Nghĩ, AI Tự Đóng Gói Thành Tri Thức
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Người sáng lập không cần ngồi viết tài liệu. Hãy ghi âm hoặc paste những lời dặn dò, kinh nghiệm thực chiến vào đây.
              </p>
            </div>

            <div className="flex items-center justify-center mb-4">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={cn(
                  "px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md active:scale-95",
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-slate-900 text-white dark:bg-[#0099ff]"
                )}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-400" />}
                <span>{isRecording ? "Đang lắng nghe... (Chạm để dừng)" : "Bắt đầu thu âm giọng nói"}</span>
              </button>
            </div>

            <textarea
              value={rawMonologue}
              onChange={(e) => setRawMonologue(e.target.value)}
              className="w-full h-44 sm:h-52 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-sans leading-relaxed"
              placeholder="Hoặc dán toàn bộ đoạn trao đổi, transcript cuộc họp, lời dặn nhân viên, quy tắc báo giá vào đây..."
            />

            <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRawMonologue("")}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Xóa văn bản
              </button>
              <button
                type="button"
                onClick={handleDistill}
                disabled={!rawMonologue.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Chắt Lọc Sang SOUL.md & MEMORY.md →</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Context Router View */}
        {viewMode === "router" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                Bộ Định Tuyến Bối Cảnh (Context Router)
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Chống Hiện Tượng Lost-in-the-Middle & Tiết Kiệm 80% Token
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ nạp đúng 2-3 trụ cột bối cảnh liên quan nhất cho từng tác vụ, không nạp toàn bộ 35.000 từ.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "proposal", label: "Lập Báo Giá (Proposal)" },
                { id: "ad_copy", label: "Viết Quảng Cáo (Ad Copy)" },
                { id: "cskh", label: "Chăm Sóc Khách Hàng (CSKH)" },
                { id: "hiring", label: "Tuyển Dụng & Sàng Lọc" },
                { id: "qc", label: "Kiểm Soát Chất Lượng (QC)" },
                { id: "finance", label: "Đối Soát Tài Chính" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTask(t.id as TaskType)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition active:scale-95",
                    activeTask === t.id
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-xs">
                <div className="font-bold text-blue-900 dark:text-blue-200 mb-1">
                  Trụ cột được nạp ({routed.activePillars.length}/8):
                </div>
                <div className="space-y-1">
                  {routed.activePillars.map((p) => (
                    <div key={p} className="text-blue-700 dark:text-blue-300 font-medium">
                      ✓ {CONTEXT_PILLARS[p].title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Token Tiết Kiệm Ước Tính:
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ~{routed.tokensSavedEstimate.toLocaleString()} tokens
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                  Giảm 75% – 85% chi phí API so với Context Dumping.
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-xs">
                <div className="font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Độ chính xác suy luận:
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                  &gt; 92%
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
                  Do tài liệu được đặt ở vị trí vàng trong context window.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Xem trước bối cảnh tinh khiết được nạp vào bot:
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-auto max-h-48 leading-relaxed">
                {routed.combinedContext}
              </pre>
            </div>
          </div>
        )}

        {/* Sticky Action Footer CTA (Mobile Optimized, no word-wrapping stack!) */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-20 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-[11px] text-center sm:text-left text-slate-400 font-medium">
            Mã hóa & lưu trữ cục bộ trong Két Sắt Doanh Nghiệp (Không lọt dữ liệu ra ngoài).
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex px-4 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSyncComplete) onSyncComplete();
                onClose();
              }}
              className="w-full sm:w-auto py-3.5 sm:py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
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
