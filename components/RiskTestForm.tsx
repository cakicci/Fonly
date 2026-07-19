"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

const questions = [
  {
    id: 1,
    question: "Yatırımın kısa sürede %20 düşse ne yaparsın?",
    options: [
      { label: "Hemen satarım, daha fazla kaybetmek istemem", score: 0 },
      { label: "Endişelenirim ama biraz daha beklerim", score: 1 },
      { label: "Fırsat olarak görür, daha fazla alırım", score: 2 }
    ]
  },
  {
    id: 2,
    question: "Bu parayı ne zaman kullanmayı düşünüyorsun?",
    options: [
      { label: "1-2 yıl içinde ihtiyacım olabilir", score: 0 },
      { label: "3-5 yıl sonra kullanabilirim", score: 1 },
      { label: "5 yıldan uzun süre bekleyebilirim", score: 2 }
    ]
  },
  {
    id: 3,
    question: "Yatırımın ikiye katlanma şansı var ama yarıya düşme riski de var. Ne yaparsın?",
    options: [
      { label: "Girmem, risk çok yüksek", score: 0 },
      { label: "Küçük bir miktarla denerim", score: 1 },
      { label: "Büyük kısmını yatırırım", score: 2 }
    ]
  },
  {
    id: 4,
    question: "Aylık gelirine göre yatırım için ne kadar ayırabilirsin?",
    options: [
      { label: "Gelirimim %5'inden azını ayırabilirim", score: 0 },
      { label: "Gelirimimin %5-15'ini ayırabilirim", score: 1 },
      { label: "Gelirimimin %15'inden fazlasını ayırabilirim", score: 2 }
    ]
  },
  {
    id: 5,
    question: "Yatırım konusundaki deneyimin nedir?",
    options: [
      { label: "Hiç deneyimim yok, yeni başlıyorum", score: 0 },
      { label: "Biraz bilgim var, takip ediyorum", score: 1 },
      { label: "Aktif olarak yatırım yapıyorum", score: 2 }
    ]
  }
];

const riskLabels: Record<string, { label: string; color: string; description: string; scenario: string }> = {
  low: {
    label: "Düşük Risk",
    color: "text-cyan-200",
    description: "Sakin ilerlemek istiyorsun. Para piyasası ve düşük riskli fonlar daha uygun.",
    scenario:
      "Somut örnek: 10.000 TL'lik bir yatırımın kötü bir ayda 8.500 TL'ye düşse muhtemelen rahatsız olur, satmayı düşünürsün — bu senin için gayet normal. Bu yüzden büyük dalgalanan araçlardan uzak durman, geceleri daha rahat uyumanı sağlar."
  },
  medium: {
    label: "Orta Risk",
    color: "text-emerald-200",
    description: "Dengeli bir yaklaşımın var. Karma fonlar ve seçili hisseler uygun olabilir.",
    scenario:
      "Somut örnek: 10.000 TL'lik bir yatırımın kötü bir ayda 8.000 TL'ye düşse endişelenirsin ama muhtemelen satmadan beklersin. Orta düzey dalgalanmalara tahammülün var; ne tamamen güvenliğe ne de tamamen büyümeye kilitlenmen gerekmiyor."
  },
  high: {
    label: "Yüksek Risk",
    color: "text-amber-200",
    description: "Düşüşlerde bekleyebiliyorsun. Büyüme odaklı fonlar ve hisseler uygun olabilir.",
    scenario:
      "Somut örnek: 10.000 TL'lik bir yatırımın kötü bir ayda 7.000-7.500 TL'ye düşse bile paniklemeden bekleyebilir, hatta fırsat görebilirsin. Yine de bu parayı yakın zamanda ihtiyaç duymayacağından emin ol — yüksek risk her zaman kazandırmaz."
  }
};

function calcRiskProfile(totalScore: number): "low" | "medium" | "high" {
  if (totalScore <= 3) return "low";
  if (totalScore <= 6) return "medium";
  return "high";
}

export function RiskTestForm() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<"low" | "medium" | "high" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const progress = ((currentQuestion) / questions.length) * 100;

  async function handleNext() {
    if (selectedOption === null) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (isLastQuestion) {
      const totalScore = newAnswers.reduce((sum, s) => sum + s, 0);
      const profile = calcRiskProfile(totalScore);
      setResult(profile);

      setIsLoading(true);
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskProfile: profile })
      });
      setIsLoading(false);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  }

  if (result) {
    const info = riskLabels[result];
    return (
      <div className="glass-card rounded-section p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-300/12">
            <CheckCircle2 className="h-8 w-8 text-emerald-200" />
          </div>
        </div>
        <p className="text-sm font-medium text-mist-3">Risk profili sonucun</p>
        <h2 className={`mt-2 text-4xl font-semibold ${info.color}`}>{info.label}</h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-mist-2">{info.description}</p>
        <div className="mx-auto mt-5 max-w-md rounded-2xl border border-line bg-white/[0.03] px-5 py-4 text-left text-sm leading-6 text-mist-2">
          {info.scenario}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn btn-lg btn-primary mt-8 px-8"
        >
          Panele dön
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-section p-6 sm:p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-mist-3">
          <span>Soru {currentQuestion + 1} / {questions.length}</span>
          <span>%{Math.round(progress)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-emerald-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="mb-6 text-xl font-semibold text-mist sm:text-2xl">{question.question}</h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedOption(option.score)}
            className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm transition ${
              selectedOption === option.score
                ? "border-emerald-200/40 bg-emerald-300/12 text-mist"
                : "border-line bg-white/[0.03] text-mist-2 hover:bg-white/[0.06]"
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
              selectedOption === option.score
                ? "border-emerald-300 bg-emerald-300 text-ink-fixed"
                : "border-line text-mist-3"
            }`}>
              {String.fromCharCode(65 + index)}
            </span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={selectedOption === null || isLoading}
        className="btn btn-lg btn-primary mt-6 w-full"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {isLastQuestion ? "Sonucu gör" : "Sonraki soru"}
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
