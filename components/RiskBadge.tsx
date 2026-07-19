import { TermTooltip } from "@/components/TermTooltip";

const riskLabels: Record<string, { label: string; className: string }> = {
  low: {
    label: "Düşük Risk",
    className: "text-cyan-200"
  },
  medium: {
    label: "Orta Risk",
    className: "text-emerald-200"
  },
  high: {
    label: "Yüksek Risk",
    className: "text-amber-200"
  }
};

interface RiskBadgeProps {
  riskProfile: "low" | "medium" | "high" | null;
}

export function RiskBadge({ riskProfile }: RiskBadgeProps) {
  if (!riskProfile) {
    return <h2 className="mt-2 text-2xl font-semibold text-mist-3">Henüz seçilmedi</h2>;
  }

  const { label, className } = riskLabels[riskProfile];

  return (
    <h2 className={`mt-2 text-2xl font-semibold ${className}`}>
      <TermTooltip term="riskProfili">{label}</TermTooltip>
    </h2>
  );
}
