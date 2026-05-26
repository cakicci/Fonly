import { NextResponse } from "next/server";
import { fetchAllFundReturns, tefasRiskToCategory } from "@/lib/tefas";

/** Liste sayfasının ihtiyacı olan sadeleşmiş fon kaydı. */
export interface FundListItem {
  kod: string;
  ad: string;
  kategori: string;
  /** 1–7 arasında TEFAS resmi risk değeri (null olabilir). */
  risk: number | null;
  /** "low" | "medium" | "high" — projemizdeki risk gruplarına eşlenmiş hâli. */
  riskGroup: "low" | "medium" | "high" | null;
  /** Yüzde değerler (örn. 12.34). Null = TEFAS yeterli veri vermiyor. */
  getiri1a: number | null;
  getiri3a: number | null;
  getiri6a: number | null;
  getiriyb: number | null;
  getiri1y: number | null;
  getiri3y: number | null;
  getiri5y: number | null;
}

export interface FonlarResponse {
  funds: FundListItem[];
  /** Mevcut benzersiz kategori adları — filtre dropdown'ı için. */
  categories: string[];
  total: number;
  updatedAt: string;
}

export async function GET() {
  try {
    const rows = await fetchAllFundReturns("YAT");

    const funds: FundListItem[] = rows
      .filter((r) => r.tefasDurum) // sadece TEFAS'ta alınıp satılabilenler
      .map((r) => ({
        kod: r.fonKodu,
        ad: r.fonUnvan,
        kategori: r.fonTurAciklama,
        risk: r.riskDegeri ? parseInt(r.riskDegeri, 10) : null,
        riskGroup: tefasRiskToCategory(r.riskDegeri),
        getiri1a: r.getiri1a,
        getiri3a: r.getiri3a,
        getiri6a: r.getiri6a,
        getiriyb: r.getiriyb,
        getiri1y: r.getiri1y,
        getiri3y: r.getiri3y,
        getiri5y: r.getiri5y,
      }))
      .sort((a, b) => a.kod.localeCompare(b.kod));

    const categories = Array.from(
      new Set(funds.map((f) => f.kategori).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "tr"));

    return NextResponse.json({
      funds,
      categories,
      total: funds.length,
      updatedAt: new Date().toISOString(),
    } satisfies FonlarResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
