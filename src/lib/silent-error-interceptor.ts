export interface OutgoingDraft {
  id: string;
  recipient: string;
  channel: "email" | "zalo" | "proposal" | "ad" | "report";
  content: string;
  quotedPrice?: number;
  costEstimate?: number;
  discountPercent?: number;
  deliveryDaysCommitment?: number;
  maxDeliveryCapacityDays?: number;
}

export interface InterceptorOptions {
  minNetMargin?: number; // default 0.35 (35%)
  maxDiscountAllowed?: number; // default 0%
  customAntiPhrases?: string[];
  strictMode?: boolean;
}

export type ViolationSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface InterceptorViolation {
  code: string;
  severity: ViolationSeverity;
  message: string;
  detectedText?: string;
}

export interface InterceptorResult {
  passed: boolean;
  status: "APPROVED" | "ESCALATE_TO_HITL" | "BLOCKED";
  confidenceScore: number; // 0 to 100
  violations: InterceptorViolation[];
  calculatedMargin?: number;
  recommendedAction: string;
}

const DEFAULT_ANTI_PHRASES = [
  "tận dụng chuyên môn",
  "leverage our expertise",
  "uy tín hàng đầu",
  "chất lượng cao nhất",
  "giải pháp toàn diện",
  "synergy",
  "ai-powered",
  "sản phẩm do ai tạo",
  "được tạo bởi trí tuệ nhân tạo",
  "cam kết 100% không rủi ro",
];

const PLACEHOLDER_PATTERNS = [
  /\[chèn\s+[^\]]+\]/i,
  /\[todo[^\]]*\]/i,
  /\[placeholder[^\]]*\]/i,
  /\{phone\}/i,
  /\{email\}/i,
  /\{tên\s*khách\}/i,
  /localhost:\d+/i,
  /example\.com/i,
  /\bnull\b/i,
  /\bundefined\b/i,
  /\bNaN\b/,
];

export function validateOutgoingDraft(
  draft: OutgoingDraft,
  options: InterceptorOptions = {}
): InterceptorResult {
  const minNetMargin = options.minNetMargin ?? 0.35;
  const maxDiscountAllowed = options.maxDiscountAllowed ?? 0;
  const antiPhrases = [
    ...DEFAULT_ANTI_PHRASES,
    ...(options.customAntiPhrases || []),
  ];

  const violations: InterceptorViolation[] = [];
  let calculatedMargin: number | undefined;

  // 1. Margin & Financial Guardrail Check
  if (draft.quotedPrice !== undefined && draft.costEstimate !== undefined) {
    if (draft.quotedPrice <= 0) {
      violations.push({
        code: "INVALID_PRICE",
        severity: "CRITICAL",
        message: "Giá báo không hợp lệ (phải lớn hơn 0).",
      });
    } else {
      calculatedMargin = (draft.quotedPrice - draft.costEstimate) / draft.quotedPrice;
      if (calculatedMargin < minNetMargin) {
        violations.push({
          code: "MARGIN_BELOW_MINIMUM",
          severity: "CRITICAL",
          message: `Biên lợi nhuận ròng (${Math.round(calculatedMargin * 100)}%) thấp hơn ngưỡng an toàn tối thiểu (${Math.round(minNetMargin * 100)}%). Bắt buộc chặn tự động!`,
        });
      }
    }
  }

  // 2. Unauthorized Discount Check
  if (draft.discountPercent !== undefined && draft.discountPercent > maxDiscountAllowed) {
    violations.push({
      code: "UNAUTHORIZED_DISCOUNT",
      severity: "CRITICAL",
      message: `Mức chiết khấu (${draft.discountPercent}%) vượt quá hạn mức cho phép (${maxDiscountAllowed}%). Cần CAIO phê duyệt trực tiếp.`,
    });
  }

  // 3. Operational Delivery Capacity Check
  if (
    draft.deliveryDaysCommitment !== undefined &&
    draft.maxDeliveryCapacityDays !== undefined &&
    draft.deliveryDaysCommitment < draft.maxDeliveryCapacityDays
  ) {
    violations.push({
      code: "DELIVERY_SLA_BREACH",
      severity: "HIGH",
      message: `Cam kết bàn giao trong ${draft.deliveryDaysCommitment} ngày trong khi phòng Vận hành cần tối thiểu ${draft.maxDeliveryCapacityDays} ngày. Nguy cơ vỡ cam kết khách hàng!`,
    });
  }

  // 4. Forbidden Jargon & Anti-Phrases Check
  const lowerContent = draft.content.toLowerCase();
  for (const phrase of antiPhrases) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      violations.push({
        code: "FORBIDDEN_ANTI_PHRASE",
        severity: "HIGH",
        message: `Phát hiện từ ngữ sáo rỗng hoặc cấm kỵ: "${phrase}". Hãy xóa bỏ hoặc thay bằng số liệu thực chứng.`,
        detectedText: phrase,
      });
    }
  }

  // 5. Unresolved Placeholder & Broken Token Check
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = draft.content.match(pattern);
    if (match) {
      violations.push({
        code: "UNRESOLVED_PLACEHOLDER",
        severity: "CRITICAL",
        message: `Bản thảo còn chứa biến chưa điền hoặc token rác: "${match[0]}".`,
        detectedText: match[0],
      });
      break;
    }
  }

  // Compute Deterministic Confidence Score
  let confidenceScore = 100;
  for (const v of violations) {
    if (v.severity === "CRITICAL") confidenceScore -= 45;
    else if (v.severity === "HIGH") confidenceScore -= 20;
    else if (v.severity === "MEDIUM") confidenceScore -= 10;
    else confidenceScore -= 5;
  }
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  const hasCritical = violations.some((v) => v.severity === "CRITICAL");
  const hasHigh = violations.some((v) => v.severity === "HIGH");

  let status: "APPROVED" | "ESCALATE_TO_HITL" | "BLOCKED" = "APPROVED";
  let recommendedAction = "Bản thảo an toàn 100%. Cho phép phát hành.";

  if (hasCritical) {
    status = "BLOCKED";
    recommendedAction = "Chặn đứng tức thì! Bản thảo vi phạm ranh giới P&L cốt tử hoặc chứa token lỗi. Bắt buộc sửa lại.";
  } else if (hasHigh || confidenceScore < 85) {
    status = "ESCALATE_TO_HITL";
    recommendedAction = "Chuyển sang hàng đợi Human-in-the-Loop để con người kiểm tra và bấm duyệt thủ công trước khi gửi.";
  }

  return {
    passed: status === "APPROVED",
    status,
    confidenceScore,
    violations,
    calculatedMargin,
    recommendedAction,
  };
}
