import { Briefcase, Building2, Globe, MapPin, Phone, Printer, Users } from "lucide-react";
import type { CompanyProfile } from "@/lib/yahoo/profile";
import { AIButton } from "@/components/ai/AIButton";

interface Props {
  profile: CompanyProfile;
  companyName: string;
}

export function CompanyProfileSection({ profile, companyName }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Üst özet kartı */}
      <div className="glass-card grid gap-3 rounded-2xl p-5 sm:grid-cols-3">
        <FactCell icon={<Briefcase className="h-3.5 w-3.5" />} label="Sektör" value={profile.sector} />
        <FactCell icon={<Building2 className="h-3.5 w-3.5" />} label="Endüstri" value={profile.industry} />
        <FactCell
          icon={<Users className="h-3.5 w-3.5" />}
          label="Tam Zamanlı Çalışan"
          value={
            profile.fullTimeEmployees != null
              ? profile.fullTimeEmployees.toLocaleString("tr-TR")
              : null
          }
        />
      </div>

      {/* İş tanımı */}
      {profile.longBusinessSummary && (
        <div className="glass-card rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Şirket Hakkında</h3>
            <AIButton
              type="company-explainer"
              context={{
                slug: `hisse-${profile.symbol}`,
                assetType: "hisse",
                assetName: companyName,
                extra: { businessSummary: profile.longBusinessSummary },
              }}
              label="Türkçe özetle"
              size="sm"
            />
          </div>
          <p className="whitespace-pre-line text-sm leading-7 text-mist/75">
            {profile.longBusinessSummary}
          </p>
          <p className="mt-3 text-[11px] text-mist/35">
            Açıklama Yahoo Finance&apos;tan geldiği için İngilizcedir. Türkçe özet için yukarıdaki AI butonunu kullanabilirsiniz.
          </p>
        </div>
      )}

      {/* İletişim kartı */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">İletişim ve Adres</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <ContactRow icon={<MapPin   className="h-3.5 w-3.5" />} label="Adres"      value={profile.address} />
          <ContactRow icon={<Globe   className="h-3.5 w-3.5" />}
                      label="Web Sitesi"
                      value={profile.website}
                      href={profile.website ? ensureProto(profile.website) : null} />
          <ContactRow icon={<Phone   className="h-3.5 w-3.5" />} label="Telefon"    value={profile.phone} />
          <ContactRow icon={<Printer className="h-3.5 w-3.5" />} label="Faks"       value={profile.fax} />
        </dl>
      </div>

      {/* Yönetim tablosu */}
      {profile.officers.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Üst Yönetim</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mist/40">
                  <th className="pb-3 pr-4 font-medium">Ad</th>
                  <th className="pb-3 pr-4 font-medium">Görev</th>
                  <th className="pb-3 text-right font-medium">Yaş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {profile.officers.map((o, i) => (
                  <tr key={`${o.name}-${i}`}>
                    <td className="py-2.5 pr-4 font-medium text-white">{o.name}</td>
                    <td className="py-2.5 pr-4 text-mist/65">{o.title}</td>
                    <td className="py-2.5 text-right tabular-nums text-mist/55">
                      {o.age != null ? o.age : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-mist/35">
        Veri kaynağı: Yahoo Finance · assetProfile.
      </p>
    </div>
  );
}

// ── Atomic ───────────────────────────────────────────────────────────────────

function FactCell({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-mist/40">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-white">{value ?? "—"}</p>
    </div>
  );
}

function ContactRow({
  icon, label, value, href,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
      <div className="mt-0.5 rounded-md bg-white/[0.04] p-1.5 text-mist/55">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-mist/40">{label}</p>
        {value
          ? href
            ? (
              <a href={href} target="_blank" rel="noopener noreferrer"
                 className="break-all text-sm text-emerald-200 hover:text-emerald-100 hover:underline">
                {value}
              </a>
            )
            : <p className="break-words text-sm text-mist/80">{value}</p>
          : <p className="text-sm text-mist/35">—</p>}
      </div>
    </div>
  );
}

function ensureProto(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
