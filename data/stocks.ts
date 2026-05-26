export type RiskLevel = "low" | "medium" | "high";
export type Horizon   = "short" | "long";

export type Stock = {
  symbol: string;
  name: string;
  price: string;
  dailyChange: string;
  fiveYearReturn: string;
  goldComparison: string;
  simpleTakeaway: string;
  explanation: string;
  risk: RiskLevel;
  horizon: Horizon;
};

export const stocks: Stock[] = [
  // ── Düşük Riskli ─────────────────────────────────────────────────────────
  {
    symbol: "BIMAS",
    name: "BİM Mağazalar",
    price: "512,00 TL",
    dailyChange: "-%0,4",
    fiveYearReturn: "%390",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Günlük alışverişin bir parçası olduğundan fiyat hareketleri görece sakin seyreder.",
    explanation: "İndirimli market sektörü ekonomik dalgalanmalardan daha az etkilenme eğilimindedir.",
    risk: "low",
    horizon: "long",
  },
  {
    symbol: "GARAN",
    name: "Garanti Bankası",
    price: "113,70 TL",
    dailyChange: "+%0,6",
    fiveYearReturn: "%520",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Türkiye'nin en büyük özel bankalarından biri; uzun vadede düzenli büyüme göstermiş.",
    explanation: "Bankacılık hisseleri faiz politikasından doğrudan etkilenir; bu da fiyatı zaman zaman dalgalandırabilir.",
    risk: "low",
    horizon: "long",
  },
  {
    symbol: "AKBNK",
    name: "Akbank",
    price: "63,25 TL",
    dailyChange: "+%0,3",
    fiveYearReturn: "%460",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Köklü ve temettü dağıtan bir banka; fiyat oynaklığı bankacılık sektörü ortalamasının altında.",
    explanation: "Büyük ölçekli bankalar piyasa şoklarına daha dirençli olabilir, ancak sektör riskleri hâlâ geçerlidir.",
    risk: "low",
    horizon: "long",
  },
  {
    symbol: "KCHOL",
    name: "Koç Holding",
    price: "198,40 TL",
    dailyChange: "+%0,8",
    fiveYearReturn: "%580",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Holding yapısı sayesinde enerji, otomotiv ve finans gibi farklı sektörlere yayılmış; riski doğal olarak dağıtır.",
    explanation: "Çeşitlendirilmiş holding hisseleri tek sektöre kıyasla daha dengeli hareket edebilir.",
    risk: "low",
    horizon: "long",
  },
  {
    symbol: "TTKOM",
    name: "Türk Telekom",
    price: "49,82 TL",
    dailyChange: "-%0,2",
    fiveYearReturn: "%310",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Altyapı ve abonelik geliriyle savunmacı bir profil; büyüme sınırlı ama istikrarlı.",
    explanation: "Telekom sektörü düzenleyici kurullara bağımlıdır; bu durum hem risk hem fırsat yaratabilir.",
    risk: "low",
    horizon: "short",
  },
  {
    symbol: "TUPRS",
    name: "Tüpraş",
    price: "234,60 TL",
    dailyChange: "+%1,1",
    fiveYearReturn: "%430",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Ham petrol fiyatlarıyla doğrudan bağlantılı; küresel enerji trendlerine göre kısa vadede işlem görür.",
    explanation: "Enerji şirketleri emtia fiyatlarına duyarlıdır; bu nedenle kısa vadeli hareketler büyük olabilir.",
    risk: "low",
    horizon: "short",
  },

  // ── Orta Riskli ──────────────────────────────────────────────────────────
  {
    symbol: "ASELS",
    name: "Aselsan",
    price: "66,35 TL",
    dailyChange: "+%2,3",
    fiveYearReturn: "%510",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Savunma sanayii ağırlıklı; uzun vadeli devlet sözleşmeleriyle görece istikrarlı gelir modeli var.",
    explanation: "Savunma harcamalarına bağlı büyüme fırsatları sunsa da ihracat ve bütçe koşulları performansı etkiler.",
    risk: "medium",
    horizon: "long",
  },
  {
    symbol: "EREGL",
    name: "Ereğli Demir Çelik",
    price: "53,90 TL",
    dailyChange: "-%0,7",
    fiveYearReturn: "%440",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Çelik talebine ve demir cevheri fiyatlarına duyarlı; yatırımcının emtia döngülerini takip etmesi gerekir.",
    explanation: "Çelik sektörü konjonktüreldir; inşaat ve sanayi üretimi yavaşladığında hisse fiyatı baskı altına girebilir.",
    risk: "medium",
    horizon: "long",
  },
  {
    symbol: "FROTO",
    name: "Ford Otosan",
    price: "1.214,00 TL",
    dailyChange: "+%1,4",
    fiveYearReturn: "%890",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Avrupa'ya ihracat geliri ve elektrikli araç yatırımıyla güçlü orta vadeli büyüme potansiyeli.",
    explanation: "Otomotiv sektörü sermaye yoğundur; tedarik zinciri sorunları veya kur dalgalanmaları kârlılığı etkileyebilir.",
    risk: "medium",
    horizon: "long",
  },
  {
    symbol: "TAVHL",
    name: "TAV Havalimanları",
    price: "312,00 TL",
    dailyChange: "+%0,9",
    fiveYearReturn: "%670",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Turizm ve uçuş trafiği arttıkça gelirleri yükseliyor; pandemi sonrası güçlü toparlanma sergiledi.",
    explanation: "Havacılık sektörü ekonomik döngülere ve jeopolitik olaylara karşı hassastır.",
    risk: "medium",
    horizon: "long",
  },
  {
    symbol: "MGROS",
    name: "Migros Ticaret",
    price: "487,50 TL",
    dailyChange: "-%0,5",
    fiveYearReturn: "%620",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Yüksek enflasyon ortamında perakende şirketleri fiyat artışını raflara yansıtarak kısa vadede öne çıkabilir.",
    explanation: "Kısa vadeli enflasyon dinamiklerinden faydalanabilir, ancak tüketici harcamalarında yavaşlama riski var.",
    risk: "medium",
    horizon: "short",
  },
  {
    symbol: "TOASO",
    name: "Tofaş Otomobil",
    price: "342,25 TL",
    dailyChange: "+%0,6",
    fiveYearReturn: "%530",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Yüksek temettü verimi ile kısa vadeli nakit akışı arayanlar için tercih edilen otomotiv hisselerinden biri.",
    explanation: "Temettü politikası değişebilir; üretim kapasitesi ve Fiat ortaklığı uzun vadeli büyümenin anahtarıdır.",
    risk: "medium",
    horizon: "short",
  },

  // ── Yüksek Riskli ─────────────────────────────────────────────────────────
  {
    symbol: "THYAO",
    name: "Türk Hava Yolları",
    price: "314,50 TL",
    dailyChange: "+%1,8",
    fiveYearReturn: "%620",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Geçmişte altından daha hızlı büyümüş, ama daha sert iniş çıkışlar yaşamış.",
    explanation: "Yakıt maliyetleri, kur ve turizm talebi hisseyi yüksek oranda etkiler; sabırlı yatırımcı için potansiyel taşır.",
    risk: "high",
    horizon: "long",
  },
  {
    symbol: "SASA",
    name: "SASA Polyester",
    price: "32,18 TL",
    dailyChange: "+%3,6",
    fiveYearReturn: "%1.240",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı, SASA çok üzerinde kaldı.",
    simpleTakeaway: "Büyük yatırım döngüsüyle birlikte olağanüstü artış yaşadı; yüksek potansiyel yüksek riskle birlikte geldi.",
    explanation: "Kapasite artışlarının tamamlanması ve hammadde fiyatları gelecekteki performansın belirleyicisidir.",
    risk: "high",
    horizon: "long",
  },
  {
    symbol: "PGSUS",
    name: "Pegasus Havacılık",
    price: "862,50 TL",
    dailyChange: "+%2,1",
    fiveYearReturn: "%740",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Düşük maliyetli model turizm patlamasından güçlü yararlandı; ancak yakıt ve kur dalgalanmaları kârlılığı zorluyor.",
    explanation: "Havacılık sektörü ince kâr marjlarıyla çalışır; tek bir şok (salgın, jeopolitik) hisseyi sert vurabilir.",
    risk: "high",
    horizon: "short",
  },
  {
    symbol: "VESTL",
    name: "Vestel Elektronik",
    price: "28,44 TL",
    dailyChange: "-%1,2",
    fiveYearReturn: "%380",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Tüketici elektroniği talebi ekonomiye duyarlı; kısa vadeli haber ve kampanyalar fiyatı hızla hareket ettirebilir.",
    explanation: "Döviz maliyetleri ve tüketici güveni bu hisseyi kısa vadede volatil kılar.",
    risk: "high",
    horizon: "short",
  },
  {
    symbol: "ZOREN",
    name: "Zorlu Enerji",
    price: "14,76 TL",
    dailyChange: "+%4,2",
    fiveYearReturn: "%950",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Yenilenebilir enerji yatırımlarıyla büyüme potansiyeli yüksek; ancak fiyat hareketleri sert olabiliyor.",
    explanation: "Enerji lisansları ve devlet teşviklerine bağımlılık hissenin uzun vadeli seyrini şekillendirir.",
    risk: "high",
    horizon: "long",
  },
];

// ── Yardımcı etiketler ──────────────────────────────────────────────────────
export const RISK_LABELS: Record<RiskLevel, string> = {
  low:    "Düşük Riskli",
  medium: "Orta Riskli",
  high:   "Yüksek Riskli",
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  long:  "Uzun Vadeli",
  short: "Kısa Vadeli",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low:    "bg-emerald-300/12 text-emerald-200 border-emerald-300/20",
  medium: "bg-amber-300/12 text-amber-200 border-amber-300/20",
  high:   "bg-rose-300/12 text-rose-200 border-rose-300/20",
};

export const HORIZON_COLORS: Record<Horizon, string> = {
  long:  "bg-cyan-300/12 text-cyan-200 border-cyan-300/20",
  short: "bg-violet-300/12 text-violet-200 border-violet-300/20",
};
