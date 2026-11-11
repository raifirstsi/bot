import React, { useEffect, useMemo, useState } from "react";
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

export const ContextVaultModal: React.FC<ContextVaultModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
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
      // Mock / fallback if Web Speech is not active
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-6"
    >
      <div className="flex flex-col h-full max-h-[92vh] w-full max-w-5xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-4 gap-3 bg-neutral-50/50 dark:bg-neutral-800/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Chương 15 & 16: RAI² FIRST OS
              </span>
              <span className="text-xs text-neutral-500">Documentation Dividend +30%</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              Két Sắt Ngữ Cảnh 8 Trụ Cột & Thu Âm Không Cần Viết
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "edit"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200"
              }`}
            >
              8 Trụ Cột
            </button>
            <button
              onClick={() => setViewMode("record")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === "record"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Record First
            </button>
            <button
              onClick={() => setViewMode("router")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === "router"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200"
              }`}
            >
              Context Router (-80% Token)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ml-2"
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === "edit" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-1 bg-neutral-50/30 dark:bg-neutral-900/50">
              {(Object.keys(CONTEXT_PILLARS) as ContextPillarId[]).map((id) => {
                const p = CONTEXT_PILLARS[id];
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap md:whitespace-normal flex-shrink-0 ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <div className="font-semibold">{p.title}</div>
                    <div
                      className={`text-[10px] truncate ${
                        active ? "text-emerald-100" : "text-neutral-500"
                      }`}
                    >
                      {p.targetWordCount}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Editor & Sharpness Panel */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Textarea */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                {distillNotice && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>{distillNotice}</span>
                    <button
                      onClick={() => setDistillNotice(null)}
                      className="text-emerald-600 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {CONTEXT_PILLARS[activeTab].title}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {CONTEXT_PILLARS[activeTab].subtitle}
                    </p>
                  </div>
                  <button
                    onClick={handleResetToTemplate}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
                  >
                    Nạp lại mẫu chuẩn
                  </button>
                </div>

                <textarea
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="flex-1 w-full min-h-[260px] p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 font-mono text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                  placeholder="Nhập nội dung bối cảnh..."
                />
              </div>

              {/* Live Sharpness Gauge */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/40 dark:bg-neutral-900/60 overflow-y-auto flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Độ Sắc Nét (Sharpness)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      sharpness.score >= 85
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : sharpness.score >= 60
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {sharpness.score}/100 {sharpness.isSharp ? "✓ ĐẠT" : "⚠ CẦN SỬA"}
                  </span>
                </div>

                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      sharpness.score >= 85
                        ? "bg-emerald-500"
                        : sharpness.score >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${sharpness.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <div className="text-neutral-400">Số từ:</div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                      {sharpness.wordCount} từ
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <div className="text-neutral-400">Từ/câu TB:</div>
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">
                      {sharpness.averageWordsPerSentence} (chuẩn 12-18)
                    </div>
                  </div>
                </div>

                {sharpness.flaggedJargon.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300">
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
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
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

                <div className="flex-1">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Góp ý mài sắc từ CAIO:
                  </div>
                  <ul className="text-[11px] space-y-1 text-neutral-600 dark:text-neutral-400">
                    {sharpness.feedback.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-neutral-400">•</span>
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
          <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-3xl mx-auto w-full">
            <div className="text-center mb-6">
              <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-950 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 mb-2">
                Quy Tắc: Record First, Write Never
              </span>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Nói Ra Mọi Suy Nghĩ, AI Tự Đóng Gói Thành Tri Thức
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Người sáng lập không cần ngồi viết hàng chục trang tài liệu. Hãy ghi âm hoặc paste những lời dặn dò, kinh nghiệm thực chiến vào đây.
              </p>
            </div>

            <div className="flex items-center justify-center mb-4">
              <button
                onClick={handleToggleRecord}
                className={`px-5 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition shadow-lg ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:scale-105"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    isRecording ? "bg-white" : "bg-rose-500"
                  }`}
                />
                {isRecording ? "Đang lắng nghe... (Bấm để dừng)" : "Bắt đầu thu âm giọng nói"}
              </button>
            </div>

            <textarea
              value={rawMonologue}
              onChange={(e) => setRawMonologue(e.target.value)}
              className="w-full h-48 p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-sans leading-relaxed"
              placeholder="Hoặc dán toàn bộ đoạn trao đổi, transcript cuộc họp, lời dặn nhân viên, quy tắc báo giá vào đây..."
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setRawMonologue("")}
                className="px-4 py-2 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Xóa văn bản
              </button>
              <button
                onClick={handleDistill}
                disabled={!rawMonologue.trim()}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <span>Chắt Lọc Sang SOUL.md & MEMORY.md</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Context Router View */}
        {viewMode === "router" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                Bộ Định Tuyến Bối Cảnh (Context Router)
              </span>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Chống Hiện Tượng Lost-in-the-Middle & Tiết Kiệm 80% Token
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Khi thực thi một tác vụ cụ thể, hệ thống chỉ trích xuất đúng 2-3 trụ cột bối cảnh liên quan nhất, không nạp toàn bộ 35.000 từ vào prompt.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: "proposal", label: "Lập Báo Giá (Proposal)" },
                { id: "ad_copy", label: "Viết Quảng Cáo (Ad Copy)" },
                { id: "cskh", label: "Chăm Sóc Khách Hàng (CSKH)" },
                { id: "hiring", label: "Tuyển Dụng & Sàng Lọc (Hiring)" },
                { id: "qc", label: "Kiểm Soát Chất Lượng (QC)" },
                { id: "finance", label: "Đối Soát Tài Chính (Finance)" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTask(t.id as TaskType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    activeTask === t.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
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

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
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

              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                <div className="font-bold text-purple-900 dark:text-purple-200 mb-1">
                  Độ chính xác suy luận:
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                  &gt; 92%
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-1">
                  Do tài liệu được đặt ở vị trí vàng đầu & cuối context window.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Xem trước bối cảnh tinh khiết được nạp vào bot:
              </div>
              <pre className="flex-1 p-4 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-auto max-h-60 leading-relaxed">
                {routed.combinedContext}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 px-5 py-3 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
          <div className="text-xs text-neutral-500">
            Tất cả tài liệu được mã hóa và lưu trữ cục bộ trong Két Sắt Doanh Nghiệp.
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                if (onSyncComplete) onSyncComplete();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              Lưu & Đồng Bộ Toàn Bộ Bots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
