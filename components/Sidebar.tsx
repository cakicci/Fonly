import { CircleDollarSign, Coins, Gem, LineChart } from "lucide-react";

const markets = [
  { name: "BIST 100", value: "10.895", change: "+%0,9", icon: LineChart },
  { name: "Dolar/TL", value: "32,24", change: "+%0,2", icon: CircleDollarSign },
  { name: "Euro/TL", value: "34,88", change: "-%0,1", icon: Coins },
  { name: "Gram Altın", value: "2.432 TL", change: "+%1,1", icon: Gem }
];

export function Sidebar() {
  return (
    <aside className="glass-card sticky top-6 rounded-[1.5rem] p-5 lg:max-h-[calc(100vh-3rem)]">
      <div className="mb-5">
        <p className="text-sm text-mist/58">Piyasa özeti</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Bugün ne oluyor?</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {markets.map((market) => {
          const Icon = market.icon;
          const isPositive = market.change.startsWith("+");

          return (
            <div
              key={market.name}
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 transition hover:border-emerald-200/24 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-white/7 p-2 text-mist/74">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-mist/80">{market.name}</span>
                </div>
                <span
                  className={
                    isPositive
                      ? "text-sm font-semibold text-emerald-200"
                      : "text-sm font-semibold text-rose-200"
                  }
                >
                  {market.change}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{market.value}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
