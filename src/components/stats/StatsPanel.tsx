import type { DerivedStats, Record3 } from "@/lib/stats/deriveStats";
import type { TimeClass } from "@/types";
import {
  COLOR_LABELS,
  RESULT_LABELS,
  TIME_CLASS_LABELS,
} from "@/lib/labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingChart } from "@/components/stats/RatingChart";
import { OpeningsCard } from "@/components/stats/OpeningsCard";
import { ResultBar } from "@/components/stats/ResultBar";
import { ResultLegend } from "@/components/stats/ResultLegend";
import { TerminationBars } from "@/components/stats/TerminationBars";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "win" | "loss" | "draw";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "text-2xl font-semibold tabular-nums",
            tone === "win" && "text-win",
            tone === "loss" && "text-loss",
            tone === "draw" && "text-draw",
          )}
        >
          {value}
        </span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}

function streakText(stats: DerivedStats): { value: string; tone?: "win" | "loss" | "draw" } {
  const { type, count } = stats.currentStreak;
  if (!type || count === 0) return { value: "—" };
  return {
    value: `${count} ${RESULT_LABELS[type].toLowerCase()}${count > 1 ? "s" : ""}`,
    tone: type,
  };
}

function ColorRow({ label, record }: { label: string; record: Record3 }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {record.winRate}% victorias
        </span>
      </div>
      <ResultBar record={record} />
    </div>
  );
}

export function StatsPanel({ stats }: { stats: DerivedStats }) {
  const streak = streakText(stats);
  const timeClasses = Object.entries(stats.byTimeClass) as [TimeClass, Record3][];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="% Victorias"
          value={`${stats.overall.winRate}%`}
          hint={`${stats.overall.games} partidas`}
        />
        <StatTile
          label="Balance"
          value={`${stats.overall.wins}-${stats.overall.draws}-${stats.overall.losses}`}
          hint="V-T-D"
        />
        <StatTile label="Racha actual" value={streak.value} tone={streak.tone} />
        <StatTile
          label="Rival promedio"
          value={stats.avgOpponentRating ? String(stats.avgOpponentRating) : "—"}
          hint="rating"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresión de rating</CardTitle>
        </CardHeader>
        <CardContent>
          <RatingChart timeline={stats.ratingTimeline} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-base">Rendimiento por color</CardTitle>
            <ResultLegend />
          </CardHeader>
          <CardContent className="grid gap-3">
            <ColorRow label={COLOR_LABELS.white} record={stats.byColor.white} />
            <ColorRow label={COLOR_LABELS.black} record={stats.byColor.black} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-base">Por ritmo</CardTitle>
            <ResultLegend />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {timeClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos.</p>
            ) : (
              timeClasses.map(([tc, rec]) => (
                <div key={tc} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{TIME_CLASS_LABELS[tc]}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {rec.games} · {rec.winRate}%
                    </span>
                  </div>
                  <ResultBar record={rec} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo gana y cómo pierde</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Formas de ganar</h4>
            <TerminationBars items={stats.winTerminations} tone="win" />
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Formas de perder</h4>
            <TerminationBars items={stats.lossTerminations} tone="loss" />
          </div>
        </CardContent>
      </Card>

      {stats.openings.length > 0 && <OpeningsCard openings={stats.openings} />}
    </div>
  );
}
