import { NextResponse } from "next/server";
import {
  fetchAllFundReturns,
  fetchFundDetail,
  tefasRiskToCategory,
} from "@/lib/tefas";

/** Detay sayfasının ihtiyacı olan birleşik fon kaydı. */
export interface FundDetailResponse {
  kod: string;
  ad: string;
  kategori: string;
  /** Şemsiye fon türü (örn. "Hisse Senedi Şemsiye Fonu"). */
  semsiye: string;
  /** TEFAS riskDegeri 1–7. */
  risk: number | null;
  riskGroup: "low" | "medium" | "high" | null;
  /** Güncel pay fiyatı (TL). */
  sonFiyat: number;
  gunlukGetiri: number | null;
  portBuyukluk: number | null;
  yatirimciSayi: number | null;
  kategoriDerece: number | null;
  kategoriFonSay: number | null;
  pazarPayi: number | null;
  // Dönem getirileri (% — null = TEFAS yeterli veri vermiyor)
  getiri1a: number | null;
  getiri3a: number | null;
  getiri6a: number | null;
  getiriyb: number | null;
  getiri1y: number | null;
  getiri3y: number | null;
  getiri5y: number | null;
  updatedAt: string;
}

export async function GET(
  _req: Request,
  { params }: { params: { kod: string } }
) {
  const fonKodu = params.kod.toUpperCase();

  try {
    // İki çağrıyı paralel — fonBilgiGetir tek satır, fonGetiriBazliBilgiGetir
    // tüm fonları döner ve kendi cache'inden gelir.
    const [detail, allReturns] = await Promise.all([
      fetchFundDetail(fonKodu),
      fetchAllFundReturns("YAT"),
    ]);

    if (!detail) {
      return NextResponse.json(
        { error: `Fon bulunamadı: ${fonKodu}` },
        { status: 404 }
      );
    }

    const returnRow = allReturns.find((r) => r.fonKodu === fonKodu);

    return NextResponse.json({
      kod: detail.fonKodu,
      ad: detail.fonUnvan,
      kategori: detail.fonKategori ?? returnRow?.fonTurAciklama ?? "",
      semsiye: returnRow?.fonTurAciklama ?? "",
      risk: returnRow?.riskDegeri ? parseInt(returnRow.riskDegeri, 10) : null,
      riskGroup: tefasRiskToCategory(returnRow?.riskDegeri ?? null),
      sonFiyat: detail.sonFiyat,
      gunlukGetiri: detail.gunlukGetiri,
      portBuyukluk: detail.portBuyukluk,
      yatirimciSayi: detail.yatirimciSayi,
      kategoriDerece: detail.kategoriDerece,
      kategoriFonSay: detail.kategoriFonSay,
      pazarPayi: detail.pazarPayi,
      getiri1a: returnRow?.getiri1a ?? null,
      getiri3a: returnRow?.getiri3a ?? null,
      getiri6a: returnRow?.getiri6a ?? null,
      getiriyb: returnRow?.getiriyb ?? null,
      getiri1y: returnRow?.getiri1y ?? null,
      getiri3y: returnRow?.getiri3y ?? null,
      getiri5y: returnRow?.getiri5y ?? null,
      updatedAt: new Date().toISOString(),
    } satisfies FundDetailResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
