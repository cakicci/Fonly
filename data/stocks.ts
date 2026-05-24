export type Stock = {
  symbol: string;
  name: string;
  price: string;
  dailyChange: string;
  fiveYearReturn: string;
  goldComparison: string;
  simpleTakeaway: string;
  explanation: string;
};

export const stocks: Stock[] = [
  {
    symbol: "THYAO",
    name: "Türk Hava Yolları",
    price: "314,50 TL",
    dailyChange: "+%1,8",
    fiveYearReturn: "%620",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Geçmişte altından daha hızlı büyümüş, ama daha sert iniş çıkışlar yaşamış.",
    explanation:
      "Bu hisse geçmişte güçlü artış göstermiş. Yine de bu, gelecekte aynı hızda artacağı anlamına gelmez."
  },
  {
    symbol: "BIMAS",
    name: "BİM Mağazalar",
    price: "512,00 TL",
    dailyChange: "-%0,4",
    fiveYearReturn: "%390",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Altından biraz daha yavaş kalmış, ama fiyat hareketleri bazı büyüme hisselerine göre daha sakin olmuş.",
    explanation:
      "Geçmiş performans tek başına karar vermek için yeterli değildir. Düzenli artış kadar düşüş dönemlerine de bakmak gerekir."
  },
  {
    symbol: "ASELS",
    name: "Aselsan",
    price: "66,35 TL",
    dailyChange: "+%2,3",
    fiveYearReturn: "%510",
    goldComparison: "Aynı dönemde gram altın yaklaşık %480 arttı.",
    simpleTakeaway: "Altına yakın ve biraz üstünde bir artış göstermiş, fakat bazı dönemlerde beklemek sabır istemiş.",
    explanation:
      "Bir hissenin geçmişte artmış olması, riski olmadığı anlamına gelmez. Fiyat kısa vadede düşebilir."
  }
];
