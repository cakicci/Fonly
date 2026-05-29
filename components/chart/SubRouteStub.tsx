import { Construction } from "lucide-react";

interface SubRouteStubProps {
  title:       string;
  description: string;
  /** Faz numarası — kullanıcı yol haritasını gördüğünde "ne zaman gelecek" anlamı için. */
  phase?:      string;
}

/**
 * Henüz uygulanmamış alt-route'lar için yer tutucu kart.
 * Faz 0'da tüm yeni sub-route'lar bunu render eder; faz tamamlandıkça
 * gerçek içerikle değiştirilir.
 */
export function SubRouteStub({ title, description, phase }: SubRouteStubProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.015] p-12 text-center">
      <div className="rounded-full bg-amber-300/10 p-3">
        <Construction className="h-5 w-5 text-amber-200/80" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-mist/55">{description}</p>
      </div>
      {phase && (
        <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1 text-[11px] text-mist/45">
          Yol haritası: {phase}
        </span>
      )}
    </div>
  );
}
