export type Fund = {
  name: string;
  riskLevel: "Düşük" | "Orta" | "Yüksek";
  oneYearReturn: string;
  explanation: string;
};

export const funds: Fund[] = [
  {
    name: "Fonly Para Piyasası Fonu",
    riskLevel: "Düşük",
    oneYearReturn: "%42,8",
    explanation:
      "Günlük dalgalanması azdır. Birikimini kısa süre bekletmek isteyenler için daha sakin bir seçenek gibi düşünülebilir."
  },
  {
    name: "Dengeli Sepet Fonu",
    riskLevel: "Orta",
    oneYearReturn: "%58,4",
    explanation:
      "Paranı tek yere koymak yerine farklı alanlara böler. Bu sayede iniş çıkışları daha dengeli yaşamayı hedefler."
  },
  {
    name: "Teknoloji Büyüme Fonu",
    riskLevel: "Yüksek",
    oneYearReturn: "%76,2",
    explanation:
      "Büyüme potansiyeli yüksek şirketlere odaklanır. Kazanç ihtimali artarken fiyat hareketleri de daha sert olabilir."
  }
];
