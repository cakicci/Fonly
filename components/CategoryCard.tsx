import type { LucideIcon } from "lucide-react";

type CategoryCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function CategoryCard({ title, description, icon: Icon }: CategoryCardProps) {
  return (
    <article className="glass-card glass-card-interactive rounded-card p-5">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-mist">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-mist-2">{description}</p>
    </article>
  );
}
