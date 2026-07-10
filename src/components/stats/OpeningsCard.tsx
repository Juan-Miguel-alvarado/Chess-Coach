import { useMemo, useState } from "react";
import type { OpeningStat } from "@/lib/stats/deriveStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResultBar, pct } from "@/components/stats/ResultBar";
import { ResultLegend } from "@/components/stats/ResultLegend";

type SortKey = "played" | "best" | "worst";

interface Row extends OpeningStat {
  winRate: number;
}

export function OpeningsCard({ openings }: { openings: OpeningStat[] }) {
  const [sort, setSort] = useState<SortKey>("played");

  const rows = useMemo<Row[]>(() => {
    const withRate = openings.map((o) => ({ ...o, winRate: pct(o.wins, o.games) }));
    const sorted = [...withRate];
    if (sort === "played") sorted.sort((a, b) => b.games - a.games);
    else if (sort === "best")
      sorted.sort((a, b) => b.winRate - a.winRate || b.games - a.games);
    else sorted.sort((a, b) => a.winRate - b.winRate || b.games - a.games);
    return sorted;
  }, [openings, sort]);

  const maxGames = Math.max(...rows.map((r) => r.games), 1);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Aperturas más jugadas</CardTitle>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="played">Más jugadas</SelectItem>
              <SelectItem value="best">Mejor resultado</SelectItem>
              <SelectItem value="worst">Peor resultado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ResultLegend />
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col">
          {rows.map((o) => (
            <li
              key={o.name}
              className="-mx-2 flex flex-col gap-1.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium leading-snug">{o.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {o.games} {o.games === 1 ? "partida" : "partidas"} ·{" "}
                  <span className="font-semibold text-foreground">{o.winRate}%</span>
                </span>
              </div>
              <ResultBar
                record={o}
                widthPercent={Math.max(12, (o.games / maxGames) * 100)}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
