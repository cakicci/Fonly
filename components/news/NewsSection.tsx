import { Calendar, ExternalLink, Info, Newspaper } from "lucide-react";
import type { NewsResult } from "@/lib/news/fetchNews";

interface Props {
  result: NewsResult;
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffMin = Math.round((now - d.getTime()) / 60_000);
    if (diffMin < 1)       return "az önce";
    if (diffMin < 60)      return `${diffMin} dk önce`;
    const diffHour = Math.round(diffMin / 60);
    if (diffHour < 24)     return `${diffHour} saat önce`;
    const diffDay = Math.round(diffHour / 24);
    if (diffDay < 7)       return `${diffDay} gün önce`;
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function NewsSection({ result }: Props) {
  if (!result.configured) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Newspaper className="mx-auto mb-3 h-6 w-6 text-mist/40" />
        <p className="text-sm font-medium text-white">Haberler şu an yüklenemiyor</p>
        <p className="mt-1 text-xs text-mist/45">
          Birkaç dakika sonra tekrar deneyebilirsiniz.
        </p>
      </div>
    );
  }

  if (result.articles.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Newspaper className="mx-auto mb-3 h-6 w-6 text-mist/40" />
        <p className="text-sm font-medium text-white">Haber bulunamadı</p>
        <p className="mt-1 text-xs text-mist/45">
          {result.assetLabel ? `“${result.assetLabel}” için ` : ""}son zamanda yayınlanmış bir haber tespit edilmedi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {result.isGeneralFallback && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[0.05] px-3 py-2 text-[12px] text-amber-100/85">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200/80" />
          <p>
            {result.assetLabel ? <><span className="font-semibold">{result.assetLabel}</span> için doğrudan haber bulunmadı. </> : null}
            Genel <span className="font-semibold">{result.categoryLabel.toLowerCase()}</span> akışı gösteriliyor.
          </p>
        </div>
      )}

      {result.articles.map(item => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card group flex gap-4 rounded-2xl p-4 transition hover:bg-white/[0.03]"
        >
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-40"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-md bg-white/8 px-2 py-0.5 font-medium text-mist/70">
                {item.source}
              </span>
              <span className="inline-flex items-center gap-1 text-mist/45">
                <Calendar className="h-3 w-3" />
                {fmtDateTime(item.publishedAt)}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-emerald-100">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-mist/55">
                {item.description}
              </p>
            )}
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-mist/40 group-hover:text-emerald-200">
              Kaynağa git
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </a>
      ))}

      <p className="text-[11px] text-mist/35">
        Kaynaklar: Bloomberg HT, Habertürk Ekonomi. İçeriklerden dış yayıncılar sorumludur.
      </p>
    </div>
  );
}
