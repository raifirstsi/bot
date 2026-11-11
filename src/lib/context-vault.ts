export type ContextPillarId =
  | "brand_voice"
  | "customer_avatar"
  | "offer_breakdown"
  | "competitive_positioning"
  | "sales_process"
  | "case_studies"
  | "sops"
  | "industry_context";

export interface ContextPillarMeta {
  id: ContextPillarId;
  title: string;
  subtitle: string;
  targetWordCount: string;
  defaultTemplate: string;
  requiredKeywords: string[];
}

export const CONTEXT_PILLARS: Record<ContextPillarId, ContextPillarMeta> = {
  brand_voice: {
    id: "brand_voice",
    title: "1. Brand Voice DNA",
    subtitle: "Quy chuẩn giọng văn, câu 12-18 từ, thể chủ động, danh sách từ cấm kỵ",
    targetWordCount: "1,500 – 3,000 từ",
    requiredKeywords: ["giọng văn", "từ cấm", "nguyên tắc", "chủ động"],
    defaultTemplate: `# BRAND VOICE DNA (RAI² FIRST OS)
- **Tôn chỉ:** Thực chiến, súc tích, định lượng bằng kết quả tài chính P&L.
- **Quy tắc độ dài câu:** 12 – 18 từ/câu, tuyệt đối không viết câu lòng vòng kéo dài >25 từ.
- **Thể câu:** Luôn dùng thể chủ động ("Chúng tôi cam kết...", "Hệ thống tự động thực hiện...").
- **Danh sách từ cấm (Anti-Phrases):**
  - CẤM: "Tận dụng chuyên môn", "Uy tín hàng đầu", "Chuyên nghiệp đỉnh cao", "Giải pháp toàn diện", "Synergy", "AI-powered".
  - THAY BẰNG: Số liệu thực chứng (ví dụ: "Rút ngắn thời gian từ 14 ngày xuống 3 ngày, bảo toàn biên lợi nhuận >= 35%").
`,
  },
  customer_avatar: {
    id: "customer_avatar",
    title: "2. Deep Customer Avatar",
    subtitle: "Chân dung cụ thể: quy mô 5-20 nhân sự, MeOS trap, nỗi đau P&L thực tế",
    targetWordCount: "2,000 – 4,000 từ",
    requiredKeywords: ["chân dung", "quy mô", "nỗi đau", "ngân sách"],
    defaultTemplate: `# DEEP CUSTOMER AVATAR
- **Đối tượng mục tiêu:** Chủ doanh nghiệp SME (5 – 20 nhân sự) tại Việt Nam.
- **Thực trạng MeOS:** Người chủ là điểm nghẽn lớn nhất: tự duyệt mọi báo giá, giải quyết sự cố, làm việc 60-70h/tuần.
- **Tử huyệt tài chính:** Doanh thu tăng nhưng dòng tiền âm, biên lợi nhuận ròng < 15%, nhân viên làm việc cơ bắp lặp đi lặp lại.
- **Mong muốn tối hậu:** Rút lui khỏi vận hành sự vụ 60 ngày mà doanh nghiệp vẫn tăng trưởng với biên lợi nhuận >= 35%.
`,
  },
  offer_breakdown: {
    id: "offer_breakdown",
    title: "3. Offer & Transformation",
    subtitle: "Đóng gói giải pháp, biểu phí dịch vụ, cam kết biên lợi nhuận >= 35%",
    targetWordCount: "2,500 – 5,000 từ",
    requiredKeywords: ["báo giá", "biên lợi nhuận", "bàn giao", "cam kết"],
    defaultTemplate: `# OFFER & TRANSFORMATION BREAKDOWN
- **Tên giải pháp:** Hệ điều hành Doanh nghiệp RAI² FIRST OS & Đội Nhân sự số Tự hành.
- **Giá trị chuyển hóa:** Chuyển đổi từ MeOS (phụ thuộc người sáng lập) sang Tự động hóa có Trách nhiệm (CAIO).
- **Quy tắc định giá:**
  - Không bán thời gian (hours), chỉ bán kết quả hoàn thành (outcomes).
  - Biên lợi nhuận gộp mục tiêu: >= 55%.
  - Biên lợi nhuận ròng cam kết: >= 35%.
  - Tuyệt đối cấm giảm giá không có sự đồng ý của CAIO.
`,
  },
  competitive_positioning: {
    id: "competitive_positioning",
    title: "4. Competitive Positioning",
    subtitle: "Ma trận so sánh với 3 đối thủ, lý do khách hàng chọn giải pháp của ta",
    targetWordCount: "1,500 – 3,000 từ",
    requiredKeywords: ["đối thủ", "khác biệt", "lợi thế", "độc quyền"],
    defaultTemplate: `# COMPETITIVE POSITIONING MATRIX
- **Đối thủ A (Agency truyền thống):** Chi phí nhân sự cao, thời gian bàn giao chậm (2-4 tuần), không có hạ tầng số.
- **Đối thủ B (Công cụ AI đơn lẻ ChatGPT/Make):** Rời rạc, thiếu ngữ cảnh doanh nghiệp, ảo giác dữ liệu, không ai chịu trách nhiệm P&L.
- **Lợi thế RAI² FIRST OS:**
  - Tích hợp 13 Nhân sự số đơn nhiệm theo 7 Vùng Nghiệp vụ TOC.
  - Có CAIO giám sát và cam kết kết quả dòng tiền.
  - Triển khai chạy thực tế trong 14 ngày.
`,
  },
  sales_process: {
    id: "sales_process",
    title: "5. Sales Process & Script",
    subtitle: "Quy trình chốt đơn từng nấc, xử lý từ chối, chính sách 0% chiết khấu",
    targetWordCount: "2,000 – 4,000 từ",
    requiredKeywords: ["quy trình", "chốt đơn", "từ chối", "báo giá"],
    defaultTemplate: `# SALES PROCESS & OBJECTION HANDLING
- **Nấc 1 - Tiếp nhận:** Khảo sát hiện trạng điểm nghẽn TOC trong 60 giây.
- **Nấc 2 - Thẩm định:** Lọc sạch lead rác, từ chối khách hàng đòi chiết khấu sâu làm mòn biên lợi nhuận.
- **Nấc 3 - Đề xuất giải pháp:** Trình bày mô phỏng 5 đòn bẩy P&L với số liệu dòng tiền cam kết.
- **Chính sách từ chối chiết khấu:**
  - Nếu khách chê đắt: Giảm phạm vi công việc (scope), tuyệt đối không giảm giá cùng scope.
`,
  },
  case_studies: {
    id: "case_studies",
    title: "6. Case Studies & Proof",
    subtitle: "Bằng chứng số học thực chứng, số liệu đo lường trước/sau của khách hàng",
    targetWordCount: "2,000 – 5,000 từ",
    requiredKeywords: ["case study", "kết quả", "trước sau", "roi"],
    defaultTemplate: `# CASE STUDIES & HARD PROOF
- **Case 1 (Agency Nội thất & Thi công B2B):**
  - Trước: Thời gian ra báo giá mất 12 ngày, tỷ lệ chốt 22%, chủ thức đêm kiểm tra bóc tách.
  - Sau khi áp dụng RAI²: Ra báo giá chuẩn xác trong 4 giờ, tỷ lệ chốt tăng lên 48%, giải phóng 25h/tuần cho chủ.
- **Case 2 (Nhà phân phối bán buôn):**
  - Tự động hóa đối soát 150 đơn hàng/ngày, loại bỏ 100% lỗi sót đơn, tiết kiệm 18 triệu đồng chi phí phạt giao chậm mỗi tháng.
`,
  },
  sops: {
    id: "sops",
    title: "7. Standard Operating Procedures",
    subtitle: "Quy trình chuẩn bàn giao, kiểm soát chất lượng QC và cổng duyệt HITL",
    targetWordCount: "3,000 – 6,000 từ",
    requiredKeywords: ["sop", "quy trình chuẩn", "kiểm thử", "duyệt"],
    defaultTemplate: `# STANDARD OPERATING PROCEDURES (SOP)
- **Bước 1 - Tiếp nhận yêu cầu:** Kiểm tra form intake đầy đủ 5 trường thông tin bắt buộc.
- **Bước 2 - Thực thi tự động:** Nhân sự số đơn nhiệm xử lý trong phạm vi đã cấp quyền.
- **Bước 3 - Cổng kiểm soát lỗi ngầm:** Chạy kiểm tra code cứng (Deterministic Assertion) phát hiện sai lệch giá và từ cấm.
- **Bước 4 - Cổng duyệt HITL:** Chuyển sang hàng đợi nhân sự phê duyệt 1-click nếu giá trị hợp đồng > 10 triệu đồng.
`,
  },
  industry_context: {
    id: "industry_context",
    title: "8. Industry & Compliance Context",
    subtitle: "Ranh giới pháp lý, bảo mật dữ liệu khách hàng và quy định ngành",
    targetWordCount: "1,500 – 3,000 từ",
    requiredKeywords: ["pháp lý", "tuân thủ", "bảo mật", "quy định"],
    defaultTemplate: `# INDUSTRY & COMPLIANCE BOUNDARIES
- **Bảo mật dữ liệu:** 100% dữ liệu tài chính, khách hàng và báo giá được mã hóa cục bộ.
- **Tuân thủ quy chế:** Mọi đề xuất thương mại phải có điều khoản thanh toán rõ ràng (đặt cọc >= 50% trước khi triển khai).
- **Cam kết bản quyền:** Không cung cấp dữ liệu nội bộ của khách hàng cho bên thứ ba.
`,
  },
};

export interface SharpnessResult {
  score: number;
  isSharp: boolean;
  wordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  flaggedJargon: string[];
  metricsFound: string[];
  antiPhrasesFound: string[];
  feedback: string[];
}

const VAGUE_JARGON = [
  "chuyên nghiệp",
  "tận tâm",
  "uy tín hàng đầu",
  "chất lượng cao",
  "hàng đầu việt nam",
  "đỉnh cao",
  "giải pháp toàn diện",
  "tận dụng chuyên môn",
  "leverage our expertise",
  "best-in-class",
  "synergy",
  "ai-powered",
  "world class",
  "dịch vụ hoàn hảo",
  "giá trị vượt trội",
];

const QUANTITATIVE_PATTERN = /(\d+([.,]\d+)?\s*(%|vnđ|vnd|usd|\$|triệu|tỷ|giờ|ngày|tuần|tháng|năm|người|h|k|m|lần))/gi;

export function scoreContextSharpness(content: string): SharpnessResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      score: 0,
      isSharp: false,
      wordCount: 0,
      sentenceCount: 0,
      averageWordsPerSentence: 0,
      flaggedJargon: [],
      metricsFound: [],
      antiPhrasesFound: [],
      feedback: ["Tài liệu hoàn toàn trống. Vui lòng nạp nội dung hoặc ghi âm chia sẻ."],
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const rawSentences = trimmed.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const sentenceCount = Math.max(1, rawSentences.length);
  const averageWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;

  const lowerContent = trimmed.toLowerCase();

  const flaggedJargon: string[] = [];
  for (const jargon of VAGUE_JARGON) {
    if (lowerContent.includes(jargon)) {
      flaggedJargon.push(jargon);
    }
  }

  const matches = trimmed.match(QUANTITATIVE_PATTERN) || [];
  const metricsFound = Array.from(new Set(matches.map((m) => m.trim())));

  const antiPhraseMatches = (trimmed.match(/cấm[:\s]|anti[- ]phrases?|không dùng|từ cấm/gi) || []).length;
  const hasAntiPhrases = antiPhraseMatches > 0;
  const antiPhrasesFound = hasAntiPhrases ? ["Có quy định danh sách từ cấm / Anti-phrases"] : [];

  let score = 50;

  if (wordCount >= 100) score += 10;
  if (wordCount >= 300) score += 10;

  if (averageWordsPerSentence >= 10 && averageWordsPerSentence <= 22) {
    score += 15;
  } else if (averageWordsPerSentence > 28) {
    score -= 10;
  }

  const metricBonus = Math.min(20, metricsFound.length * 4);
  score += metricBonus;

  if (hasAntiPhrases) {
    score += 15;
  }

  const jargonPenalty = flaggedJargon.length * 8;
  score -= jargonPenalty;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const feedback: string[] = [];
  if (flaggedJargon.length > 0) {
    feedback.push(`Phát hiện ${flaggedJargon.length} cụm từ sáo rỗng: "${flaggedJargon.slice(0, 3).join('", "')}". Hãy xóa hoặc thay thế bằng số liệu đo lường.`);
  }
  if (metricsFound.length < 2) {
    feedback.push("Thiếu số liệu định lượng (%, số tiền, số giờ, tỷ lệ biên lợi nhuận). Hãy bổ sung ít nhất 2 con số thực tế.");
  }
  if (!hasAntiPhrases) {
    feedback.push("Chưa có danh mục từ cấm kỵ (Anti-phrases). Bổ sung mục 'Danh sách từ cấm' để bot không nói hớ.");
  }
  if (averageWordsPerSentence > 25) {
    feedback.push("Độ dài câu trung bình quá dài (>25 từ/câu). Cần ngắt câu ngắn gọn (12–18 từ) để AI bắt chước chuẩn.");
  }
  if (score >= 85) {
    feedback.push("Tài liệu đạt chuẩn độ sắc nét xuất sắc (>= 85 điểm). Sẵn sàng đồng bộ cho toàn bộ Đội nhân sự số!");
  }

  return {
    score,
    isSharp: score >= 85,
    wordCount,
    sentenceCount,
    averageWordsPerSentence,
    flaggedJargon,
    metricsFound,
    antiPhrasesFound,
    feedback,
  };
}

export interface DistilledKnowledge {
  soul: string;
  memory: string;
  rules: string;
  detectedPillar: ContextPillarId;
  summary: string;
}

export function distillUnscriptedKnowledge(rawText: string): DistilledKnowledge {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  let detectedPillar: ContextPillarId = "brand_voice";
  if (lower.includes("báo giá") || lower.includes("biên lợi nhuận") || lower.includes("định giá") || lower.includes("gói dịch vụ")) {
    detectedPillar = "offer_breakdown";
  } else if (lower.includes("chân dung") || lower.includes("avatar") || lower.includes("nỗi đau khách") || lower.includes("đối tượng khách")) {
    detectedPillar = "customer_avatar";
  } else if (lower.includes("đối thủ") || lower.includes("so sánh") || lower.includes("khác biệt")) {
    detectedPillar = "competitive_positioning";
  } else if (lower.includes("sales") || lower.includes("chốt") || lower.includes("từ chối") || lower.includes("hợp đồng")) {
    detectedPillar = "sales_process";
  } else if (lower.includes("case") || lower.includes("dự án trước") || lower.includes("kết quả")) {
    detectedPillar = "case_studies";
  } else if (lower.includes("sop") || lower.includes("quy trình") || lower.includes("bước 1") || lower.includes("bàn giao")) {
    detectedPillar = "sops";
  } else if (lower.includes("pháp lý") || lower.includes("bảo mật") || lower.includes("quy định")) {
    detectedPillar = "industry_context";
  }

  const soul = `# SOUL.MD - BẢN THỂ TÔN CHỈ (TỰ ĐỘNG BIÊN DỊCH)
- **Phong cách:** Thực chiến, thẳng thắn, bảo vệ biên lợi nhuận ròng >= 35%.
- **Quy tắc ngôn ngữ:** Trả lời trực diện, nêu số liệu trước khi giải thích.
- **Tiếng nói thương hiệu trích xuất từ người sáng lập:**
${trimmed
  .split("\n")
  .filter((l) => l.trim().length > 0)
  .map((l) => `  > "${l.trim()}"`)
  .slice(0, 5)
  .join("\n")}
`;

  const memory = `# MEMORY.MD - KINH NGHIỆM THỰC CHIẾN & NGOẠI LỆ (TỰ ĐỘNG BIÊN DỊCH)
- **Thời điểm trích xuất:** ${new Date().toISOString()}
- **Trụ cột nghiệp vụ:** ${CONTEXT_PILLARS[detectedPillar].title}
- **Các bài học & luật ngầm của người sáng lập:**
${trimmed
  .split("\n")
  .filter((l) => l.trim().length > 10)
  .map((l, i) => `- [Rule ${i + 1}]: ${l.trim()}`)
  .slice(0, 8)
  .join("\n")}
`;

  const rules = `# COMPANY-RULES.MD - LƯỚI BẢO VỆ CỨNG (DETERMINISTIC GUARDRAILS)
- [RULE-01] Biên lợi nhuận ròng tối thiểu 35%, mọi thỏa thuận dưới 35% phải bị chặn.
- [RULE-02] Tuyệt đối cấm tự động gửi chiết khấu giá nếu không có xác nhận của CAIO / Chủ doanh nghiệp.
- [RULE-03] Không cam kết thời gian bàn giao nếu không kiểm tra công suất của phòng Vận hành/Delivery.
- [RULE-04] Cấm sử dụng các từ ngữ sáo rỗng trong giao tiếp khách hàng.
`;

  const summary = `Đã chắt lọc thành công bản ghi âm/văn bản thành 3 tệp tri thức chuẩn hóa (SOUL.md, MEMORY.md, company-rules.md) gắn với trụ cột "${CONTEXT_PILLARS[detectedPillar].title}".`;

  return {
    soul,
    memory,
    rules,
    detectedPillar,
    summary,
  };
}

export type TaskType = "proposal" | "ad_copy" | "cskh" | "hiring" | "qc" | "finance";

const TASK_PILLAR_MAP: Record<TaskType, ContextPillarId[]> = {
  proposal: ["offer_breakdown", "brand_voice", "sales_process", "case_studies"],
  ad_copy: ["brand_voice", "customer_avatar", "competitive_positioning"],
  cskh: ["brand_voice", "sops", "offer_breakdown"],
  hiring: ["brand_voice", "sops", "industry_context"],
  qc: ["sops", "industry_context", "offer_breakdown"],
  finance: ["offer_breakdown", "sales_process", "industry_context"],
};

export function routeContextForTask(
  task: TaskType,
  allPillars: Partial<Record<ContextPillarId, string>>
): {
  activePillars: ContextPillarId[];
  combinedContext: string;
  tokensSavedEstimate: number;
} {
  const activePillars = TASK_PILLAR_MAP[task] || ["brand_voice", "offer_breakdown"];
  const sections: string[] = [];

  for (const pillarId of activePillars) {
    const content = allPillars[pillarId] || CONTEXT_PILLARS[pillarId].defaultTemplate;
    sections.push(`=== ${CONTEXT_PILLARS[pillarId].title} ===\n${content.trim()}`);
  }

  const combinedContext = sections.join("\n\n");
  const fullWordCount = Object.values(CONTEXT_PILLARS).reduce((acc, p) => acc + (allPillars[p.id]?.length || p.defaultTemplate.length) / 5, 0);
  const routedWordCount = combinedContext.length / 5;
  const tokensSavedEstimate = Math.max(0, Math.round(fullWordCount - routedWordCount));

  return {
    activePillars,
    combinedContext,
    tokensSavedEstimate,
  };
}
