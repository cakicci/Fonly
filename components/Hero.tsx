"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ElementType } from "react";

type Slide = {
  Icon: ElementType;
  iconBg: string;
  title: string;
  description: string;
  highlight?: boolean;
};

const SLIDES: Slide[] = [
  {
    Icon: Zap,
    iconBg: "bg-amber-300/12 text-amber-200",
    title: "Canlı piyasa takibi",
    description:
      "Döviz, altın ve BIST hisseleri anlık olarak güncellenir. Her sayfa yenilemeden haberdar olursun.",
  },
  {
    Icon: ShieldCheck,
    iconBg: "bg-emerald-300/12 text-emerald-200",
    title: "Risk grubuna göre filtrele",
    description:
      "Düşük, Orta ve Yüksek riskli hisseler ayrı listelenir. Kendine uygun grubu seç, geri kalanı biz sıralarız.",
  },
  {
    Icon: BookOpen,
    iconBg: "bg-cyan-300/12 text-cyan-200",
    title: "6 bölümlük yatırım rehberi",
    description:
      "Sade Türkçe ile yazılmış, finansal okuryazarlığa yeni başlayanlar için adım adım izlence.",
  },
  {
    Icon: Target,
    iconBg: "bg-rose-300/12 text-rose-200",
    title: "Risk profili testi",
    description:
      "Birkaç soruyla hangi yatırım türünün sana uygun olduğunu öğren.",
  },
  {
    Icon: Scale,
    iconBg: "bg-violet-300/12 text-violet-200",
    title: "Altınla karşılaştır",
    description:
      "Her hissenin getirisini, herkesin bildiği gram altın bazında görürsün. Sayılar anında anlam kazanır.",
  },
  {
    Icon: BarChart3,
    iconBg: "bg-sky-300/12 text-sky-200",
    title: "Fon analizi",
    description:
      "Hazır yatırım sepetlerini teknik jargon olmadan incele. Her fonun neye benzediğini günlük dilde okursun.",
  },
  {
    Icon: Sparkles,
    iconBg: "bg-emerald-300/15 text-emerald-200",
    title: "Hepsi herkes için",
    description:
      "Canlı takip, risk testi, rehber, karşılaştırma… Bunları kullanmak için finans geçmişine ihtiyacın yok. Fonly, her adımı sade tutmak için tasarlandı.",
    highlight: true,
  },
];

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Hareket azaltma tercihi olan kullanıcıda otomatik döngü çalışmaz;
    // noktalarla elle gezinme açık kalır.
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section className="relative overflow-hidden rounded-hero border border-line bg-hero px-5 py-8 shadow-card sm:px-8 lg:px-10 lg:py-12">
      <div className="absolute left-8 top-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute bottom-8 right-12 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        {/* Sol: başlık + butonlar */}
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-[#d1fae5]">
            <Sparkles className="h-4 w-4" />
            Yeni başlayanlar için sade yatırım rehberi
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
            Finans bilmeden yatırım dünyasını keşfet.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
            Fonları ve hisseleri herkesin anlayacağı şekilde analiz et.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/risk-test" className="btn btn-lg btn-primary shadow-glow">
              <Target className="h-4 w-4" />
              Risk Testine Başla
            </Link>
            <Link href="/hisseler" className="btn btn-lg btn-secondary text-white">
              Hisseleri İncele
              <TrendingUp className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Sağ: döngüsel özellik kartları */}
        <div
          className={`glass-card glass-sheen rounded-panel p-5 sm:p-6 ${
            SLIDES[current].highlight ? "glass-tint-positive" : ""
          }`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Kart içeriği — min-height ile yükseklik sabitlenir */}
          <div className="relative min-h-[168px]">
            {SLIDES.map((slide, i) => {
              const Icon = slide.Icon;
              return (
                <div
                  key={i}
                  className={`transition-all duration-500 ${
                    i === current
                      ? "relative opacity-100 translate-y-0"
                      : "pointer-events-none absolute inset-0 translate-y-2 opacity-0"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${slide.iconBg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-semibold text-mist">{slide.title}</p>
                  <p className="mt-2 text-sm leading-6 text-mist-2">{slide.description}</p>
                </div>
              );
            })}
          </div>

          {/* İlerleme noktaları */}
          <div className="mt-5 flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Slayt ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 bg-emerald-300"
                    : "w-1.5 bg-mist-3 hover:bg-mist-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
