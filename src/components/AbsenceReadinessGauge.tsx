import { useMemo, useState, useEffect } from "react";
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
  onOpenContextVault?: () => void;
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
  level: { title: string; subtitle: string; status: string };
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

  let level: { title: string; subtitle: string; status: string };
  if (overallScore >= 80) {
    level = {
      title: "Cấp độ 3: Sẵn sàng vắng mặt 14 ngày (Absence Ready)",
      subtitle: "Hệ thống tự vận hành ổn định. Dòng tiền và vận hành được bảo vệ bởi rào chắn HITL thông minh.",
      status: "Sẵn sàng",
    };
  } else if (overallScore >= 50) {
    level = {
      title: "Cấp độ 2: Bán tự hành (Semi-Autonomous)",
      subtitle: "Vắng mặt an toàn tối đa 3 - 5 ngày. Cần bổ sung nhân sự số ở các phòng ban chịu tải cao.",
      status: "Bán tự hành",
    };
  } else {
    level = {
      title: "Cấp độ 1: Phụ thuộc Người sáng lập (Founder Bottleneck)",
      subtitle: "Doanh nghiệp đình trệ nếu người sáng lập vắng mặt quá 48h. Hãy kích hoạt nhân sự số trọng yếu.",
      status: "Điểm nghẽn",
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
  onOpenContextVault,
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
    <section
      data-absence-readiness=""
      className={cn(
        "overflow-hidden rounded-xl border border-hairline/50 bg-card",
        className
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-hairline/40 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-ink">
            Chỉ số Sẵn sàng Vắng mặt 14 ngày (ARI)
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
            Đo lường năng lực tự hành và rào chắn an toàn tài chính của 7 phòng ban cốt lõi (RAI² First OS).
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-semibold leading-none text-ink">{overallScore}%</div>
          <div className="mt-1 text-[12px] text-ink-secondary">{level.status}</div>
        </div>
      </header>

      {(onOpenTocDiagnostic || onOpenFingerprint || onOpenContextVault) && (
        <div
          data-readiness-actions=""
          className="flex gap-2 overflow-x-auto border-b border-hairline/40 px-4 py-3 scrollbar-none sm:px-5"
        >
          {onOpenTocDiagnostic && (
            <button
              type="button"
              onClick={onOpenTocDiagnostic}
              className="ui-button shrink-0 whitespace-nowrap"
            >
              Bắt Điểm Nghẽn TOC (60s)
            </button>
          )}
          {onOpenFingerprint && (
            <button
              type="button"
              onClick={onOpenFingerprint}
              className="ui-button shrink-0 whitespace-nowrap"
            >
              Sổ giá &amp; Rào chắn ngành
            </button>
          )}
          {onOpenContextVault && (
            <button
              type="button"
              onClick={onOpenContextVault}
              className="ui-button shrink-0 whitespace-nowrap"
            >
              Két Sắt Ngữ Cảnh
            </button>
          )}
        </div>
      )}

      {fingerprint && (
        <div className="flex items-start justify-between gap-3 border-b border-hairline/40 px-4 py-3 text-[12px] sm:items-center sm:px-5">
          <div className="min-w-0 text-ink-secondary">
            <span className="font-medium text-ink">{fingerprint.companyName}</span>
            <span className="mx-1.5 text-ink-tertiary">·</span>
            <span>Biên LN mục tiêu ≥{fingerprint.targetNetMargin}%</span>
            <span className="mx-1.5 text-ink-tertiary">·</span>
            <span>Chiết khấu tối đa ≤{fingerprint.maxDiscountAllowed}%</span>
          </div>
          {onOpenFingerprint && (
            <button
              type="button"
              onClick={onOpenFingerprint}
              className="shrink-0 font-medium text-ink hover:underline"
            >
              Cập nhật
            </button>
          )}
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        <h4 className="text-[13px] font-medium text-ink">{level.title}</h4>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
          {level.subtitle}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-control">
          <div
            className="h-full rounded-full bg-ink/45 transition-[width] duration-500"
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      <div className="border-t border-hairline/40 px-4 pb-2 pt-4 sm:px-5">
        <h4 className="text-[12px] font-medium text-ink-secondary">
          Độ bao phủ 7 Phòng Ban (7-Zone Coverage)
        </h4>
        <div className="mt-2 divide-y divide-hairline/40">
          {zones.map((zone) => {
            const isCovered = zone.activeAgentsCount > 0;
            return (
              <div
                key={zone.code}
                data-readiness-zone={zone.code}
                className="flex min-h-12 items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{zone.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-secondary">
                    <span>Trọng số: {(zone.weight * 100).toFixed(0)}%</span>
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
                    className="ui-button ui-button-sm shrink-0"
                  >
                    Tuyển
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {gapAlerts.length > 0 && (
          <p className="border-t border-hairline/40 py-3 text-[12px] leading-relaxed text-ink-secondary">
            {gapAlerts.length} phòng ban trọng yếu chưa có nhân sự số phụ trách.
          </p>
        )}
      </div>
    </section>
  );
}
