import { useMemo, useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowUpRight, Building2, Gauge } from "lucide-react";
import { RAI2_DEPARTMENTS, type RaiDepartment } from "@/lib/rai2-departments";
import { loadSavedFingerprint, type CompanyFingerprintData } from "@/components/CompanyFingerprintModal";
import { cn } from "@/lib/cn";

export interface ZoneReadiness {
  code: string;
  name: string;
  zone: number;
  weight: number;
  autonomy: number; // 0 to 1
  safety: number; // 0 to 1
  activeAgentsCount: number;
}

export interface AbsenceReadinessGaugeProps {
  /** Active bot keys or IDs */
  activeBotIds?: string[];
  className?: string;
  onHireDepartment?: (deptCode: string) => void;
  onOpenFingerprint?: () => void;
  onOpenTocDiagnostic?: () => void;
}

const ZONE_WEIGHTS: Record<string, number> = {
  ZONE_1_EXECUTIVE: 0.15,
  ZONE_2_MARKETING: 0.15,
  ZONE_3_SALES: 0.20,
  ZONE_4_OPERATIONS: 0.20,
  ZONE_5_RETENTION: 0.10,
  ZONE_6_FINANCE: 0.15,
  ZONE_7_HR: 0.05,
};

export function computeAbsenceReadiness(activeBotIds: string[] = []): {
  overallScore: number;
  zones: ZoneReadiness[];
  level: { title: string; subtitle: string; color: string; badge: string };
  gapAlerts: Array<{ deptCode: string; title: string; reason: string }>;
} {
  const activeSet = new Set(
    (activeBotIds || [])
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .map((id) => id.trim().toLowerCase())
  );

  const zones: ZoneReadiness[] = RAI2_DEPARTMENTS.map((dept: RaiDepartment) => {
    const matchingAgents = dept.agents.filter(
      (agent) =>
        activeSet.has(agent.key.toLowerCase()) ||
        activeSet.has(agent.name.toLowerCase())
    );
    const activeCount = matchingAgents.length;
    const totalAgents = dept.agents.length;

    const autonomy = totalAgents > 0 ? Math.min(1, activeCount / totalAgents) : 0;
    const safety = activeCount > 0 ? 0.95 : 0.0;
    const weight = ZONE_WEIGHTS[dept.code] ?? 0.1;

    return {
      code: dept.code,
      name: dept.name,
      zone: dept.zone,
      weight,
      autonomy,
      safety,
      activeAgentsCount: activeCount,
    };
  });

  // Calculate Weighted ARI: Sum(w_i * Autonomy_i * Safety_i) * 100
  const overallFraction = zones.reduce(
    (sum, z) => sum + z.weight * z.autonomy * z.safety,
    0
  );
  const overallScore = Math.min(100, Math.round(overallFraction * 100));

  let level: { title: string; subtitle: string; color: string; badge: string };
  if (overallScore >= 80) {
    level = {
      title: "Cấp độ 3: Sẵn sàng vắng mặt 14 ngày (Absence Ready)",
      subtitle: "Hệ thống tự vận hành ổn định. Dòng tiền và vận hành được bảo vệ bởi rào chắn HITL thông minh.",
      color: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    };
  } else if (overallScore >= 50) {
    level = {
      title: "Cấp độ 2: Bán tự hành (Semi-Autonomous)",
      subtitle: "Vắng mặt an toàn tối đa 3 - 5 ngày. Cần bổ sung nhân sự số ở các phòng ban chịu tải cao.",
      color: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    };
  } else {
    level = {
      title: "Cấp độ 1: Phụ thuộc Người sáng lập (Founder Bottleneck)",
      subtitle: "Doanh nghiệp đình trệ nếu người sáng lập vắng mặt quá 48h. Hãy kích hoạt nhân sự số trọng yếu.",
      color: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800",
    };
  }

  const gapAlerts = zones
    .filter((z) => z.activeAgentsCount === 0 && z.weight >= 0.15)
    .map((z) => ({
      deptCode: z.code,
      title: `Lỗ hổng trọng yếu: ${z.name}`,
      reason: `Chiếm ${(z.weight * 100).toFixed(0)}% trọng số vận hành nhưng chưa có nhân sự số nào phụ trách.`,
    }));

  return { overallScore, zones, level, gapAlerts };
}

export function AbsenceReadinessGauge({
  activeBotIds = [],
  className,
  onHireDepartment,
  onOpenFingerprint,
  onOpenTocDiagnostic,
}: AbsenceReadinessGaugeProps) {
  const { overallScore, zones, level, gapAlerts } = useMemo(
    () => computeAbsenceReadiness(activeBotIds),
    [activeBotIds]
  );
  const [fingerprint, setFingerprint] = useState<CompanyFingerprintData | null>(null);

  useEffect(() => {
    setFingerprint(loadSavedFingerprint());
  }, []);

  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline/60 bg-card p-6 shadow-xs backdrop-blur-xs",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-hairline/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ShieldCheck className="size-4" />
            </span>
            <h3 className="text-base font-semibold tracking-tight text-ink">
              Chỉ số Sẵn sàng Vắng mặt 14 ngày (ARI)
            </h3>
          </div>
          <p className="mt-1 text-xs text-ink-secondary">
            Đo lường năng lực tự hành và rào chắn an toàn tài chính của 7 phòng ban cốt lõi (RAI² First OS).
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto">
          {onOpenTocDiagnostic && (
            <button
              type="button"
              onClick={onOpenTocDiagnostic}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Gauge className="size-3.5 text-amber-500 shrink-0" />
              <span>Bắt Điểm Nghẽn TOC (60s)</span>
            </button>
          )}
          {onOpenFingerprint && (
            <button
              type="button"
              onClick={onOpenFingerprint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-raised/70 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised-hover hover:border-hairline-strong transition-colors"
            >
              <Building2 className="size-3.5 text-accent shrink-0" />
              <span>Sổ giá & Rào chắn ngành</span>
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto sm:ml-0">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                {overallScore}%
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium text-ink-tertiary">
                Điểm số ARI
              </div>
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold select-none",
                level.badge
              )}
            >
              {overallScore >= 80 ? "Sẵn sàng" : overallScore >= 50 ? "Bán tự hành" : "Điểm nghẽn"}
            </span>
          </div>
        </div>
      </div>

      {/* Active Fingerprint Summary Banner */}
      {fingerprint && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/5 border border-accent/20 px-3.5 py-2 text-xs text-ink">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-accent">{fingerprint.companyName}</span>
            <span className="text-ink-tertiary">·</span>
            <span className="text-ink-secondary">Biên LN mục tiêu: ≥{fingerprint.targetNetMargin}%</span>
            <span className="text-ink-tertiary">·</span>
            <span className="text-ink-secondary">Chiết khấu tối đa: ≤{fingerprint.maxDiscountAllowed}%</span>
          </div>
          {onOpenFingerprint && (
            <button
              type="button"
              onClick={onOpenFingerprint}
              className="text-[11px] font-semibold text-accent hover:underline shrink-0 ml-2"
            >
              Cập nhật
            </button>
          )}
        </div>
      )}

      {/* Level Summary Banner */}
      <div className="mt-4 rounded-xl bg-raised/50 p-4 border border-hairline/30">
        <h4 className={cn("text-xs font-bold uppercase tracking-wider", level.color)}>
          {level.title}
        </h4>
        <p className="mt-1 text-xs text-ink-secondary leading-relaxed">
          {level.subtitle}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
          <div
            className={cn(
              "h-full transition-all duration-500 rounded-full",
              overallScore >= 80
                ? "bg-emerald-500"
                : overallScore >= 50
                ? "bg-amber-500"
                : "bg-rose-500"
            )}
            style={{ width: `${Math.max(4, overallScore)}%` }}
          />
        </div>
      </div>

      {/* 7-Zone Department Grid */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-3">
          Độ bao phủ 7 Phòng Ban (7-Zone Coverage)
        </h4>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => {
            const isCovered = zone.activeAgentsCount > 0;
            return (
              <div
                key={zone.code}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3 transition-colors",
                  isCovered
                    ? "border-hairline/60 bg-raised/30"
                    : "border-rose-200/50 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isCovered ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />
                    )}
                    <span className="truncate text-xs font-medium text-ink">
                      {zone.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-secondary">
                    <span>Trọng số: {(zone.weight * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>
                      {zone.activeAgentsCount > 0
                        ? `${zone.activeAgentsCount} nhân sự số`
                        : "Chưa kích hoạt"}
                    </span>
                  </div>
                </div>

                {!isCovered && onHireDepartment && (
                  <button
                    type="button"
                    onClick={() => onHireDepartment(zone.code)}
                    className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-lg bg-raised px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-raised-hover hover:text-accent-hover transition-colors"
                  >
                    <span>Tuyển</span>
                    <ArrowUpRight className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Gap Alerts */}
      {gapAlerts.length > 0 && (
        <div className="mt-5 space-y-2">
          {gapAlerts.map((gap) => (
            <div
              key={gap.deptCode}
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300"
            >
              <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{gap.title}: </span>
                <span>{gap.reason}</span>
              </div>
              {onHireDepartment && (
                <button
                  type="button"
                  onClick={() => onHireDepartment(gap.deptCode)}
                  className="shrink-0 font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  Bổ sung ngay
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
