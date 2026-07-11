import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowsDiff,
  IconBarbell,
  IconDeviceGamepad2,
  IconRefresh,
  IconTarget,
  IconTrendingUp,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Student } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { studentRepository, gameCacheRepository } from "@/lib/repositories";
import { fetchStudentGames } from "@/lib/api/fetchStudentGames";
import { loadSummaries, type StudentSummary } from "@/lib/stats/compare";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricKey =
  | "games"
  | "puzzles"
  | "puzzleAccuracy"
  | "winRate"
  | "ratingChange";

interface Metric {
  key: MetricKey;
  label: string;
  icon: ReactNode;
  pick: (s: StudentSummary) => number | null;
  fmt: (v: number | null) => string;
  signed?: boolean; // valores que pueden ser negativos (Δ rating)
}

const METRICS: Metric[] = [
  {
    key: "games",
    label: "Partidas jugadas",
    icon: <IconDeviceGamepad2 size={18} />,
    pick: (s) => s.games,
    fmt: (v) => `${v ?? 0}`,
  },
  {
    key: "puzzles",
    label: "Puzzles resueltos",
    icon: <IconBarbell size={18} />,
    pick: (s) => s.puzzles,
    fmt: (v) => (v == null ? "—" : `${v}`),
  },
  {
    key: "puzzleAccuracy",
    label: "% Acierto táctica",
    icon: <IconTarget size={18} />,
    pick: (s) => s.puzzleAccuracy,
    fmt: (v) => (v == null ? "—" : `${v}%`),
  },
  {
    key: "winRate",
    label: "% Victorias",
    icon: <IconTrophy size={18} />,
    pick: (s) => s.winRate,
    fmt: (v) => `${v ?? 0}%`,
  },
  {
    key: "ratingChange",
    label: "Δ Rating",
    icon: <IconTrendingUp size={18} />,
    pick: (s) => s.ratingChange,
    fmt: (v) => (v == null ? "—" : v > 0 ? `+${v}` : `${v}`),
    signed: true,
  },
];

export function Compare() {
  const { teacher } = useAuth();
  const [syncKey, setSyncKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [metric, setMetric] = useState<MetricKey>("games");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const students = useMemo<Student[]>(
    () => (teacher ? studentRepository.list(teacher.id) : []),
    [teacher, syncKey],
  );
  const summaries = useMemo(
    () => loadSummaries(students),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, syncKey],
  );

  // Ranking (desc) por cada métrica; null va al final.
  const rankings = useMemo(() => {
    const out = {} as Record<MetricKey, StudentSummary[]>;
    for (const m of METRICS) {
      out[m.key] = [...summaries].sort((a, b) => {
        const av = m.pick(a);
        const bv = m.pick(b);
        return (bv ?? -Infinity) - (av ?? -Infinity);
      });
    }
    return out;
  }, [summaries]);

  async function syncAll() {
    setSyncing(true);
    try {
      for (const s of students) {
        try {
          const result = await fetchStudentGames(s);
          gameCacheRepository.set({
            studentId: s.id,
            fetchedAt: Date.now(),
            games: result.games,
            ratings: result.ratings,
            errors: result.errors,
          });
        } catch {
          /* seguir con el resto */
        }
      }
      setSyncKey((k) => k + 1);
      toast.success("Alumnos sincronizados");
    } finally {
      setSyncing(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (students.length < 1) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">
          Agrega alumnos para ver su ranking.
        </p>
        <Button asChild variant="outline">
          <Link to="/students">Ir a Mis alumnos</Link>
        </Button>
      </div>
    );
  }

  const activeMetric = METRICS.find((m) => m.key === metric)!;
  const ranking = rankings[metric];
  const selectedSummaries = summaries.filter((s) => selected.has(s.student.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ranking de alumnos
          </h1>
          <p className="text-sm text-muted-foreground">
            Elige una categoría para ver el ranking del último mes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncAll} disabled={syncing}>
            <IconRefresh
              size={16}
              className={syncing ? "animate-spin" : undefined}
            />
            {syncing ? "Sincronizando…" : "Sincronizar todos"}
          </Button>
          <Button asChild>
            <Link to="/students">
              <IconUsers size={16} /> Mis alumnos
            </Link>
          </Button>
        </div>
      </div>

      {/* Selector de métrica: cada tarjeta muestra al líder y abre su ranking */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {METRICS.map((m) => {
          const leader = rankings[m.key][0];
          const leaderVal = leader ? m.pick(leader) : null;
          const active = m.key === metric;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "flex flex-col gap-1 rounded-xl border bg-card p-4 text-left transition-colors",
                active
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-2 text-xs font-medium uppercase tracking-wide",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {m.icon}
                {m.label}
              </span>
              {leader && leaderVal != null && leaderVal !== 0 ? (
                <>
                  <span className="truncate text-lg font-semibold">
                    {leader.student.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {m.fmt(leaderVal)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  —
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ranking de la métrica seleccionada */}
      <Card>
        <CardContent className="py-2">
          <div className="mb-2 flex items-center gap-2 px-1 pt-2 text-sm font-medium">
            {activeMetric.icon}
            Ranking · {activeMetric.label}
          </div>
          <Leaderboard
            ranking={ranking}
            metric={activeMetric}
            selected={selected}
            onToggle={toggle}
          />
        </CardContent>
      </Card>

      {/* Versus lado a lado */}
      {selectedSummaries.length >= 2 ? (
        <Versus summaries={selectedSummaries} />
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconArrowsDiff size={16} />
          Marca alumnos con la casilla para enfrentarlos lado a lado.
        </p>
      )}
    </div>
  );
}

function Leaderboard({
  ranking,
  metric,
  selected,
  onToggle,
}: {
  ranking: StudentSummary[];
  metric: Metric;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const values = ranking.map((s) => metric.pick(s));
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v ?? 0)));

  return (
    <ul className="flex flex-col">
      {ranking.map((s, i) => {
        const v = metric.pick(s);
        const width = `${(Math.abs(v ?? 0) / maxAbs) * 100}%`;
        const negative = metric.signed && (v ?? 0) < 0;
        const isSel = selected.has(s.student.id);
        return (
          <li
            key={s.student.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors",
              isSel && "bg-muted/50",
            )}
          >
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary"
              checked={isSel}
              onChange={() => onToggle(s.student.id)}
              aria-label={`Comparar a ${s.student.name}`}
            />
            <RankBadge rank={i + 1} />
            <Link
              to={`/students/${s.student.id}`}
              className="w-28 shrink-0 truncate font-medium hover:underline sm:w-44"
              title={s.student.name}
            >
              {s.student.name}
            </Link>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  negative ? "bg-loss" : "bg-primary",
                )}
                style={{ width }}
              />
            </div>
            <span
              className={cn(
                "w-14 shrink-0 text-right font-semibold tabular-nums",
                negative && "text-loss",
                metric.signed && (v ?? 0) > 0 && "text-win",
              )}
            >
              {metric.fmt(v)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-amber-400 text-amber-950",
    2: "bg-zinc-300 text-zinc-800",
    3: "bg-amber-700 text-amber-50",
  };
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
        styles[rank] ?? "bg-muted text-muted-foreground",
      )}
    >
      {rank}
    </span>
  );
}

function ratingLabel(v: number | null): string {
  if (v == null) return "—";
  return v > 0 ? `+${v}` : String(v);
}

function Versus({ summaries }: { summaries: StudentSummary[] }) {
  const rows: {
    label: string;
    get: (s: StudentSummary) => number | null;
    fmt: (v: number | null) => string;
    higherBetter: boolean;
  }[] = [
    { label: "Partidas", get: (s) => s.games, fmt: (v) => String(v ?? 0), higherBetter: true },
    { label: "Puzzles resueltos", get: (s) => s.puzzles, fmt: (v) => (v == null ? "—" : String(v)), higherBetter: true },
    { label: "% Acierto táctica", get: (s) => s.puzzleAccuracy, fmt: (v) => (v == null ? "—" : `${v}%`), higherBetter: true },
    { label: "% Victorias", get: (s) => s.winRate, fmt: (v) => `${v ?? 0}%`, higherBetter: true },
    { label: "Victorias", get: (s) => s.wins, fmt: (v) => String(v ?? 0), higherBetter: true },
    { label: "Derrotas", get: (s) => s.losses, fmt: (v) => String(v ?? 0), higherBetter: false },
    { label: "Δ Rating", get: (s) => s.ratingChange, fmt: ratingLabel, higherBetter: true },
  ];

  return (
    <Card>
      <CardContent className="overflow-x-auto py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <IconArrowsDiff size={16} /> Comparación directa
        </div>
        <table className="w-full min-w-[420px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="pb-3 text-left font-medium text-muted-foreground">
                Métrica
              </th>
              {summaries.map((s) => (
                <th key={s.student.id} className="pb-3 text-right font-semibold">
                  {s.student.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const values = summaries.map((s) => r.get(s));
              const nums = values.filter((v): v is number => v != null);
              const best = nums.length
                ? r.higherBetter
                  ? Math.max(...nums)
                  : Math.min(...nums)
                : null;
              return (
                <tr key={r.label}>
                  <td className="border-t py-2 text-muted-foreground">{r.label}</td>
                  {summaries.map((s, i) => {
                    const v = values[i];
                    const isBest =
                      best != null && v === best && summaries.length > 1;
                    return (
                      <td
                        key={s.student.id}
                        className={cn(
                          "border-t py-2 text-right tabular-nums",
                          isBest && "font-semibold text-primary",
                        )}
                      >
                        {r.fmt(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
