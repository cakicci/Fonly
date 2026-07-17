import type { LucideIcon } from "lucide-react";

type GuideCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function GuideCard({ title, description, icon: Icon }: GuideCardProps) {
  return (
    <article className="rounded-card border border-white/8 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-mist-2">{description}</p>
    </article>
  );
}
