/**
 * Theory of Constraints (TOC) Constraint Detector & 5-Lever P&L Engine
 * Based on Chapter 10 & 11 of The AI First Company & RAI² First OS.
 */

export interface TocDiagnosticInput {
  hasBacklogOver48h: boolean;
  backlogDepartment?: "ZONE_3_SALES" | "ZONE_4_OPERATIONS" | "ZONE_6_FINANCE";
  ownerHoursPerWeekSpentOnOperations: number; // e.g. 15 hours
  deliveryCapacityUtilization: number; // 0 to 100 (%)
  quoteTurnaroundDays: number; // e.g. 7 days
  currentMonthlyRevenue: number; // e.g. 300,000,000 VND
  currentNetMargin: number; // e.g. 20 (%)
}

export type TocConstraintType =
  | "DELIVERY_BOTTLENECK" // Zone 4 Operations
  | "SALES_QUOTING_BOTTLENECK" // Zone 3 Sales
  | "OWNER_TIME_SINK_BOTTLENECK" // Zone 1 Executive / Operations
  | "FINANCE_CASHFLOW_BOTTLENECK" // Zone 6 Finance
  | "MARKETING_LEAD_BOTTLENECK"; // Zone 2 Marketing

export interface TocDiagnosisResult {
  constraintType: TocConstraintType;
  primaryZone: string; // e.g. "ZONE_3_SALES"
  zoneNumber: number;
  departmentName: string;
  recommendedAgentKey: string; // e.g. "bao_gia_toc_do"
  urgencyLevel: "CRITICAL" | "HIGH" | "MODERATE";
  title: string;
  description: string;
  symptomExplanation: string;
  upstreamBlockWarning?: string; // If marketing was requested but delivery is clogged
  levers: {
    lever1MarketingLeadGrowth: number; // %
    lever2TurnaroundCompressionRatio: number; // %
    lever3ErrorReductionCost: number; // VND
    lever4MarginExpansion: number; // %
    lever5ReinvestmentPool: number; // VND
    projectedMonthlyRevenue: number; // VND
    projectedNetMargin: number; // %
    projectedMonthlyProfit: number; // VND
  };
}

export function diagnoseBusinessConstraint(input: TocDiagnosticInput): TocDiagnosisResult {
  const isDeliveryOverloaded = input.deliveryCapacityUtilization > 85;
  const isQuotingSlow = input.quoteTurnaroundDays >= 3;
  const isOwnerTrapped = input.ownerHoursPerWeekSpentOnOperations >= 10;
  const hasBacklog = input.hasBacklogOver48h;

  let constraintType: TocConstraintType;
  let primaryZone: string;
  let zoneNumber: number;
  let departmentName: string;
  let recommendedAgentKey: string;
  let urgencyLevel: "CRITICAL" | "HIGH" | "MODERATE";
  let title: string;
  let description: string;
  let symptomExplanation: string;
  let upstreamBlockWarning: string | undefined;

  // RULE 1 (Upstream Validation Gate): If delivery capacity > 85%, DO NOT OPEN MARKETING.
  // Delivery/operations is the single binding constraint.
  if (isDeliveryOverloaded) {
    constraintType = "DELIVERY_BOTTLENECK";
    primaryZone = "ZONE_4_OPERATIONS";
    zoneNumber = 4;
    departmentName = "Vận Hành & Sản Xuất";
    recommendedAgentKey = "rai-task";
    urgencyLevel = "CRITICAL";
    title = "Điểm Nghẽn Công Suất Giao Hàng & Vận Hành (>85%)";
    description =
      "Xưởng/đội ngũ thi công đang quá tải trầm trọng. Đóng gói quy trình và nén thời gian giao hàng là ưu tiên sống còn trước khi chi thêm tiền quảng cáo.";
    symptomExplanation = `Công suất hiện tại đạt ${input.deliveryCapacityUtilization}%. Bơm thêm khách vào lúc này sẽ dẫn đến vỡ tiến độ, khách hàng phàn nàn và phạt hợp đồng.`;
    upstreamBlockWarning =
      "Khóa van Marketing: Tuyệt đối không chi thêm tiền chạy quảng cáo khi công đoạn giao hàng đang nghẽn.";
  }
  // RULE 2: If quote turnaround is slow (>= 3 days) or quoting backlog exists, Sales Quoting is the bottleneck (Case Joel)
  else if (isQuotingSlow || (hasBacklog && input.backlogDepartment === "ZONE_3_SALES")) {
    constraintType = "SALES_QUOTING_BOTTLENECK";
    primaryZone = "ZONE_3_SALES";
    zoneNumber = 3;
    departmentName = "Bán Hàng & Chốt Deal";
    recommendedAgentKey = "rai-quote";
    urgencyLevel = "CRITICAL";
    title = "Điểm Nghẽn Tốc Độ Báo Giá & Chốt Đơn (Tồn đọng hồ sơ)";
    description =
      "Khách hàng phải chờ báo giá quá lâu khiến tỷ lệ chốt đơn rơi tự do và lãng phí toàn bộ chi phí quảng cáo trước đó.";
    symptomExplanation = `Thời gian phản hồi báo giá đang là ${input.quoteTurnaroundDays} ngày. Rút ngắn xuống dưới 2h sẽ tăng tỷ lệ thắng thầu lên gấp 2.5 lần.`;
  }
  // RULE 3: Owner is trapped doing operations (>= 10h/week)
  else if (isOwnerTrapped) {
    constraintType = "OWNER_TIME_SINK_BOTTLENECK";
    primaryZone = "ZONE_1_EXECUTIVE";
    zoneNumber = 1;
    departmentName = "Ban Lãnh Đạo & Điều Hành";
    recommendedAgentKey = "rai-strategy";
    urgencyLevel = "HIGH";
    title = "Điểm Nghẽn Người Sáng Lập (Founder MeOS Trap)";
    description =
      "Người chủ đang mất trên 10h mỗi tuần để can thiệp thủ công vào các tác vụ cơ học, khiến công ty mất đi người cầm lái chiến lược.";
    symptomExplanation = `Chủ doanh nghiệp đang dành ${input.ownerHoursPerWeekSpentOnOperations}h/tuần cho việc vặt. Cần nhân sự số ủy quyền ngay lập tức.`;
  }
  // RULE 4: Finance / Cashflow backlog
  else if (hasBacklog && input.backlogDepartment === "ZONE_6_FINANCE") {
    constraintType = "FINANCE_CASHFLOW_BOTTLENECK";
    primaryZone = "ZONE_6_FINANCE";
    zoneNumber = 6;
    departmentName = "Tài Chính & Kế Toán";
    recommendedAgentKey = "rai-cash";
    urgencyLevel = "HIGH";
    title = "Điểm Nghẽn Dòng Tiền & Thu Hồi Công Nợ";
    description =
      "Doanh nghiệp làm nhiều việc nhưng tiền chưa về tài khoản, dòng tiền bị ứ đọng tại khâu nghiệm thu và thanh toán đợt cuối.";
    symptomExplanation =
      "Tồn đọng hồ sơ thanh toán quá 48h. Cần nhân sự số tự động nhắc nợ đa tầng và đối soát VietQR ngay.";
  }
  // Default: Marketing / Lead generation
  else {
    constraintType = "MARKETING_LEAD_BOTTLENECK";
    primaryZone = "ZONE_2_MARKETING";
    zoneNumber = 2;
    departmentName = "Tiếp Thị & Tạo Nhu Cầu";
    recommendedAgentKey = "rai-lead";
    urgencyLevel = "MODERATE";
    title = "Điểm Nghẽn Nguồn Khách Hàng Tiềm Năng (Lead Flow)";
    description =
      "Các khâu vận hành và bán hàng đang ổn định và có dư công suất. Đây là thời điểm vàng để mở van Tiếp thị và thu hút khách hàng mới.";
    symptomExplanation =
      "Công suất vận hành an toàn. Kích hoạt nhân sự số nghiên cứu thị trường và sáng tạo nội dung đa kênh.";
  }

  // Calculate the 5-Lever P&L Flywheel Compounding Effects
  const rev = Math.max(10_000_000, input.currentMonthlyRevenue);
  const baseMarginFraction = Math.min(0.8, Math.max(0.05, input.currentNetMargin / 100));

  // Lever 1: Marketing Lead growth (+25%)
  const lever1Growth = isDeliveryOverloaded ? 0 : 0.25;

  // Lever 2: Turnaround Speed (+15% capacity gain)
  const lever2SpeedGain = isQuotingSlow ? 0.20 : 0.10;

  // Lever 3: Error and rework reduction (estimated 5% revenue saving)
  const lever3CostSaving = Math.round(rev * 0.05);

  // Lever 4: Margin Expansion (+15% relative improvement towards >= 35% safe benchmark)
  const targetMarginFraction = Math.max(baseMarginFraction * 1.15, 0.35);

  // Projected Compounded Revenue: Base * (1 + L1) * (1 + L2)
  const projectedRevenue = Math.round(rev * (1 + lever1Growth) * (1 + lever2SpeedGain));

  // Projected Net Profit: Projected Rev * Target Margin + Error Savings
  const projectedProfit = Math.round(projectedRevenue * targetMarginFraction + lever3CostSaving);

  // Lever 5: Reinvestment pool (trích 30% lợi nhuận dôi dư để tái đầu tư)
  const currentProfit = Math.round(rev * baseMarginFraction);
  const incrementalProfit = Math.max(0, projectedProfit - currentProfit);
  const reinvestmentPool = Math.round(incrementalProfit * 0.3);

  return {
    constraintType,
    primaryZone,
    zoneNumber,
    departmentName,
    recommendedAgentKey,
    urgencyLevel,
    title,
    description,
    symptomExplanation,
    upstreamBlockWarning,
    levers: {
      lever1MarketingLeadGrowth: Math.round(lever1Growth * 100),
      lever2TurnaroundCompressionRatio: Math.round(lever2SpeedGain * 100),
      lever3ErrorReductionCost: lever3CostSaving,
      lever4MarginExpansion: Math.round(targetMarginFraction * 100),
      lever5ReinvestmentPool: reinvestmentPool,
      projectedMonthlyRevenue: projectedRevenue,
      projectedNetMargin: Math.round(targetMarginFraction * 100),
      projectedMonthlyProfit: projectedProfit,
    },
  };
}
