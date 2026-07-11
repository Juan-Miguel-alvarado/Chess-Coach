import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBarbell,
  IconEdit,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { CurrentRatings, GameSource, Tactics, TimeClass } from "@/types";
import { studentRepository } from "@/lib/repositories";
import { useStudentGames } from "@/lib/useStudentGames";
import { deriveStats } from "@/lib/stats/deriveStats";
import { SOURCE_LABELS, TIME_CLASS_LABELS, formatRelative } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { GameList } from "@/components/GameList";
import { cn } from "@/lib/utils";

function RatingsRow({ ratings }: { ratings: CurrentRatings }) {
  const rows: { source: string; entries: [TimeClass, number][] }[] = [];
  if (ratings.chesscom) {
    rows.push({
      source: SOURCE_LABELS.chesscom,
      entries: Object.entries(ratings.chesscom) as [TimeClass, number][],
    });
  }
  if (ratings.lichess) {
    rows.push({
      source: SOURCE_LABELS.lichess,
      entries: Object.entries(ratings.lichess) as [TimeClass, number][],
    });
  }
  const withData = rows.filter((r) => r.entries.length > 0);
  if (withData.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {withData.map((r) => (
        <div key={r.source} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{r.source}</span>
          {r.entries.map(([tc, rating]) => (
            <Badge key={tc} variant="secondary" className="gap-1 font-normal">
              {TIME_CLASS_LABELS[tc]}
              <span className="font-semibold tabular-nums">{rating}</span>
            </Badge>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const student = id ? studentRepository.get(id) : null;
  const { games, ratings, tactics, errors, loading, fetchedAt, refresh } =
    useStudentGames(student);
  const [source, setSource] = useState<GameSource>("chesscom");

  // Fuentes disponibles según los usuarios que tenga el alumno.
  const availableSources: GameSource[] = [];
  if (student?.chesscomUsername?.trim()) availableSources.push("chesscom");
  if (student?.lichessUsername?.trim()) availableSources.push("lichess");
  // El selector sólo tiene sentido si el alumno tiene ambas cuentas.
  const hasBoth = availableSources.length > 1;
  const activeSource: GameSource = availableSources.includes(source)
    ? source
    : availableSources[0] ?? "chesscom";

  const visibleGames = useMemo(
    () => games.filter((g) => g.source === activeSource),
    [games, activeSource],
  );
  const visibleRatings = useMemo<CurrentRatings>(
    () =>
      activeSource === "chesscom"
        ? { chesscom: ratings.chesscom }
        : { lichess: ratings.lichess },
    [ratings, activeSource],
  );
  const stats = useMemo(() => deriveStats(visibleGames), [visibleGames]);

  if (!student) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">Alumno no encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/students">Volver a Mis alumnos</Link>
        </Button>
      </div>
    );
  }

  function onDelete() {
    if (!student) return;
    if (confirm(`¿Eliminar a ${student.name}? Esta acción no se puede deshacer.`)) {
      studentRepository.remove(student.id);
      toast.success("Alumno eliminado");
      navigate("/students");
    }
  }

  const errorList = Object.values(errors).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/students">
          <IconArrowLeft size={16} /> Mis alumnos
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
            <p className="text-sm text-muted-foreground">
              {student.age != null ? `${student.age} años` : "Edad no indicada"}
              {student.chesscomUsername && ` · Chess.com: ${student.chesscomUsername}`}
              {student.lichessUsername && ` · Lichess: ${student.lichessUsername}`}
            </p>
          </div>
          <RatingsRow ratings={visibleRatings} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <IconRefresh size={16} className={loading ? "animate-spin" : undefined} />
            {loading ? "Sincronizando…" : "Sincronizar"}
          </Button>
          <Button variant="outline" size="icon" asChild aria-label="Editar">
            <Link to={`/students/${student.id}/edit`}>
              <IconEdit size={16} />
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete} aria-label="Eliminar">
            <IconTrash size={16} />
          </Button>
        </div>
      </div>

      {student.chesscomUsername && (
        <TacticsBox tactics={tactics} />
      )}

      {student.notes && (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <span className="font-medium">Notas: </span>
          {student.notes}
        </div>
      )}

      {errorList.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorList.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <IconAlertCircle size={16} /> {e}
            </div>
          ))}
        </div>
      )}

      {hasBoth && (
        <SourceToggle
          value={activeSource}
          onChange={setSource}
          counts={{
            chesscom: games.filter((g) => g.source === "chesscom").length,
            lichess: games.filter((g) => g.source === "lichess").length,
          }}
        />
      )}

      {loading && games.length === 0 ? (
        <LoadingState />
      ) : (
        <>
          <Tabs defaultValue="stats">
            <TabsList>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="games">
                Partidas ({visibleGames.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-6">
              {visibleGames.length === 0 ? (
                <EmptyGames fetchedAt={fetchedAt} source={activeSource} />
              ) : (
                <StatsPanel stats={stats} />
              )}
            </TabsContent>
            <TabsContent value="games" className="mt-6">
              <GameList studentId={student.id} games={visibleGames} />
            </TabsContent>
          </Tabs>
          {fetchedAt && (
            <p className="text-xs text-muted-foreground">
              Última sincronización {formatRelative(fetchedAt)} · se actualiza
              automáticamente cada 3 min.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SourceToggle({
  value,
  onChange,
  counts,
}: {
  value: GameSource;
  onChange: (v: GameSource) => void;
  counts: Record<GameSource, number>;
}) {
  const options: { key: GameSource; label: string }[] = [
    { key: "chesscom", label: SOURCE_LABELS.chesscom },
    { key: "lichess", label: SOURCE_LABELS.lichess },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        Fuente de estadísticas
      </span>
      <div className="inline-flex w-fit rounded-lg border bg-muted/40 p-1">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              value === o.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            <span className="ml-1.5 text-xs tabular-nums opacity-70">
              {counts[o.key]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TacticsBox({ tactics }: { tactics: Tactics | null }) {
  const acc =
    tactics && tactics.attempted > 0
      ? Math.round((tactics.passed / tactics.attempted) * 100)
      : null;
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <IconBarbell size={18} className="text-muted-foreground" />
          Táctica · Puzzles de Chess.com
        </span>
        <span className="text-xs text-muted-foreground">histórico</span>
      </div>
      {tactics ? (
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <TacticStat label="Resueltos" value={tactics.passed} tone="win" />
          <TacticStat label="Fallados" value={tactics.failed} tone="loss" />
          <TacticStat label="Intentados" value={tactics.attempted} />
          <TacticStat label="Acierto" value={acc != null ? `${acc}%` : "—"} />
          {tactics.rating != null && (
            <TacticStat label="Rating táctica" value={tactics.rating} />
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin datos de táctica todavía — pulsa Sincronizar.
        </p>
      )}
    </div>
  );
}

function TacticStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "win" | "loss";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "win" && "text-win",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyGames({
  fetchedAt,
  source,
}: {
  fetchedAt: number | null;
  source: GameSource;
}) {
  return (
    <div className="rounded-lg border border-dashed py-14 text-center">
      <p className="text-sm text-muted-foreground">
        {fetchedAt
          ? `No se encontraron partidas en ${SOURCE_LABELS[source]} el último mes.`
          : "Sincroniza para cargar las partidas."}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
