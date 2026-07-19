/**
 * Finansal terim sözlüğü — TermTooltip bileşeninin veri kaynağı.
 *
 * Her giriş tek cümlelik, jargonsuz bir açıklama içerir. Yeni bir terim
 * eklerken aynı kısalıkta ve günlük dile yakın kal.
 */

export interface GlossaryEntry {
  term: string;
  explanation: string;
}

export const GLOSSARY = {
  // ── Değerleme oranları ───────────────────────────────────────────────────
  piyasaDegeri: {
    term: "Piyasa Değeri",
    explanation: "Şirketin borsadaki toplam değeri — hisse fiyatı × toplam hisse sayısı.",
  },
  firmaDegeri: {
    term: "Firma Değeri (EV)",
    explanation: "Şirketi bugün satın almanın gerçek maliyeti; piyasa değerine borçları ekler, nakdi çıkarır.",
  },
  fk: {
    term: "F/K Oranı",
    explanation: "Hissenin fiyatının, şirketin yıllık kârının kaç katı olduğunu gösterir. Düşükse 'ucuz', yüksekse 'pahalı' algısı yaratır — ama sektöre göre karşılaştırılmalı.",
  },
  peg: {
    term: "PEG Oranı",
    explanation: "F/K oranını şirketin büyüme hızına göre normalleştirir; 1'in altı genelde makul kabul edilir.",
  },
  pddd: {
    term: "PD/DD",
    explanation: "Hissenin fiyatının, şirketin defterlerindeki net değerine oranı. 1'in altı, piyasanın şirketi defter değerinin altında fiyatladığı anlamına gelebilir.",
  },
  fdSatislar: {
    term: "FD/Satışlar",
    explanation: "Firma değerinin yıllık satışlara oranı — henüz kâr etmeyen şirketleri kıyaslarken kullanılır.",
  },
  fdFavok: {
    term: "FD/FAVÖK",
    explanation: "Firma değerinin faiz-vergi-amortisman öncesi kâra (FAVÖK) oranı — şirketleri borç yapısından bağımsız kıyaslar.",
  },
  hisseBasiKar: {
    term: "Hisse Başına Kâr (EPS)",
    explanation: "Şirketin net kârının toplam hisse sayısına bölünmüş hâli — bir hissenin ne kadar kâr ürettiğini gösterir.",
  },
  defterDegeri: {
    term: "Defter Değeri / Hisse",
    explanation: "Şirket bugün tasfiye edilse, bir hisseye düşecek net varlık miktarı.",
  },
  beta: {
    term: "Beta",
    explanation: "Hissenin piyasaya göre ne kadar oynak olduğunu gösterir. 1'in üzeri, piyasadan daha sert dalgalanır demektir.",
  },

  // ── Kârlılık & büyüme ────────────────────────────────────────────────────
  brutMarj: {
    term: "Brüt Marj",
    explanation: "Satışların yüzde kaçının, üretim maliyeti düşüldükten sonra kâr olarak kaldığını gösterir.",
  },
  faaliyetMarji: {
    term: "Faaliyet Marjı",
    explanation: "Ana iş faaliyetinden, tüm giderler sonrası kalan kâr yüzdesi.",
  },
  netKarMarji: {
    term: "Net Kâr Marjı",
    explanation: "Satışların yüzde kaçının en sonunda net kâra dönüştüğünü gösterir.",
  },
  favokMarji: {
    term: "FAVÖK Marjı",
    explanation: "Faiz, vergi ve amortisman öncesi operasyonel kârlılığı gösterir.",
  },
  ozkaynakKarliligi: {
    term: "Özkaynak Kârlılığı (ROE)",
    explanation: "Ortakların koyduğu sermayenin şirket tarafından ne kadar verimli kullanıldığını gösterir.",
  },
  aktifKarliligi: {
    term: "Aktif Kârlılığı (ROA)",
    explanation: "Şirketin sahip olduğu tüm varlıkların ne kadar kâr ürettiğini gösterir.",
  },
  hasilatBuyumesi: {
    term: "Hasılat Büyümesi",
    explanation: "Şirketin satışlarının bir önceki döneme göre yüzde kaç arttığı.",
  },
  karBuyumesi: {
    term: "Kâr Büyümesi",
    explanation: "Şirketin net kârının bir önceki döneme göre yüzde kaç arttığı.",
  },

  // ── Bilanço & likidite ───────────────────────────────────────────────────
  borcOzkaynak: {
    term: "Borç / Özkaynak",
    explanation: "Şirketin ne kadarının borçla, ne kadarının ortak sermayesiyle finanse edildiğini gösterir. Yüksekse borç yükü fazladır.",
  },
  cariOran: {
    term: "Cari Oran",
    explanation: "Kısa vadeli varlıkların, kısa vadeli borçları kaç kat karşıladığını gösterir. 1'in altı likidite sıkıntısına işaret edebilir.",
  },
  asitTestOrani: {
    term: "Asit-Test Oranı",
    explanation: "Cari orana benzer ama stokları hariç tutar — en hızlı nakde çevrilebilir varlıklarla borç karşılama gücünü gösterir.",
  },
  serbestNakitAkisi: {
    term: "Serbest Nakit Akışı",
    explanation: "Şirketin faaliyetlerinden elde ettiği, yatırım harcamaları düşüldükten sonra elde kalan nakit.",
  },
  isletmeNakitAkisi: {
    term: "İşletme Nakit Akışı",
    explanation: "Şirketin asıl işinden fiilen ne kadar nakit ürettiğini gösterir — kârdan farklı olarak muhasebe oyunlarına daha az açıktır.",
  },

  // ── Temettü ──────────────────────────────────────────────────────────────
  temettuVerimi: {
    term: "Temettü Verimi",
    explanation: "Şirketin bir yılda dağıttığı temettünün hisse fiyatına oranı — hisseyi tutarak elde edeceğin yıllık 'kira geliri' gibi düşünebilirsin.",
  },
  dagitimOrani: {
    term: "Dağıtım Oranı",
    explanation: "Şirketin kârının yüzde kaçını temettü olarak dağıttığını gösterir. Çok yüksekse, kâr düşünce temettü de kesilebilir.",
  },

  // ── Teknik göstergeler ───────────────────────────────────────────────────
  rsi: {
    term: "RSI",
    explanation: "0-100 arası bir hız göstergesi. 70 üzeri 'aşırı alım' (fiyat çok hızlı yükseldi), 30 altı 'aşırı satım' (çok hızlı düştü) sinyali verir.",
  },
  stoch: {
    term: "Stokastik (Stoch)",
    explanation: "Fiyatın son dönemdeki en yüksek-en düşük aralığına göre nerede olduğunu ölçer; RSI'a benzer aşırı alım/satım sinyali verir.",
  },
  macd: {
    term: "MACD",
    explanation: "İki farklı hızda hareketli ortalamanın farkını izleyerek trend yönü ve gücündeki değişimi yakalamaya çalışır.",
  },
  williamsR: {
    term: "Williams %R",
    explanation: "Stokastik göstergeye benzer, ters ölçekli bir aşırı alım/satım göstergesi.",
  },
  cci: {
    term: "CCI",
    explanation: "Fiyatın kendi ortalamasından ne kadar saptığını ölçer; uç değerler trend dönüşü sinyali olabilir.",
  },
  adx: {
    term: "ADX",
    explanation: "Trendin yönünü değil gücünü ölçer. 20'nin altı zayıf/yatay trend, üzeri güçlü trend anlamına gelir.",
  },
  atr: {
    term: "ATR",
    explanation: "Fiyatın ortalama günlük ne kadar oynadığını gösterir — yön değil, sadece oynaklık/risk ölçüsüdür.",
  },
  bollinger: {
    term: "Bollinger Bantları",
    explanation: "Fiyatın etrafına çizilen bir 'normal aralık' bandı. Fiyat üst banda yaklaşırsa pahalı, alt banda yaklaşırsa ucuz görünebilir.",
  },
  ma: {
    term: "Hareketli Ortalama (MA)",
    explanation: "Belirli bir dönemin ortalama fiyatı — kısa vadeli dalgalanmaları yumuşatıp genel trendi görmeyi kolaylaştırır.",
  },

  // ── Risk ─────────────────────────────────────────────────────────────────
  riskProfili: {
    term: "Risk Profili",
    explanation: "Yatırımlarının değerinde büyük iniş çıkışlara ne kadar tahammül edebileceğini gösteren kişisel profilin. Risk testinde verdiğin cevaplara göre hesaplanır.",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

const INDICATOR_PREFIX_MAP: [prefix: string, key: GlossaryKey][] = [
  ["RSI", "rsi"],
  ["Stoch", "stoch"],
  ["MACD", "macd"],
  ["Williams", "williamsR"],
  ["CCI", "cci"],
  ["ADX", "adx"],
  ["ATR", "atr"],
  ["Bollinger", "bollinger"],
  ["MA", "ma"],
];

/**
 * Teknik özet tablolarındaki serbest metin etiketlerden ("RSI (14)", "MA50"
 * gibi) sözlük anahtarını bulur. Eşleşme yoksa null döner — çağıran taraf bu
 * durumda tooltipsiz düz metin gösterir.
 */
export function glossaryKeyForIndicatorLabel(label: string): GlossaryKey | null {
  const match = INDICATOR_PREFIX_MAP.find(([prefix]) => label.startsWith(prefix));
  return match ? match[1] : null;
}
