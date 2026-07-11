import { useMemo } from "react";
import { Link } from "react-router-dom";
import { IconBrandGithub, IconChevronRight } from "@tabler/icons-react";
import type { Student } from "@/types";
import { useStudentGames } from "@/lib/useStudentGames";
import { deriveStats } from "@/lib/stats/deriveStats";
import { deriveAlerts } from "@/lib/stats/alerts";
import { formatRelative } from "@/lib/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecordBar, RecordLegend } from "@/components/RecordBar";
import { FormDots } from "@/components/FormDots";
import { AlertBadges } from "@/components/AlertBadges";

export function StudentCard({ student }: { student: Student }) {
  // Sólo caché: el dashboard no dispara descargas masivas.
  const { games, tactics, fetchedAt } = useStudentGames(student, false);
  const stats = useMemo(() => deriveStats(games), [games]);
  const alerts = useMemo(() => deriveAlerts(games), [games]);
  const accuracy =
    tactics && tactics.attempted > 0
      ? Math.round((tactics.passed / tactics.attempted) * 100)
      : null;

  return (
    <Link to={`/students/${student.id}`} className="group block h-full">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.age != null ? `${student.age} años` : "Edad no indicada"}
              </p>
            </div>
            <IconChevronRight
              size={18}
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {student.chesscomUsername && (
              <Badge variant="secondary" className="gap-1 font-normal">
                Chess.com · {student.chesscomUsername}
              </Badge>
            )}
            {student.lichessUsername && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <IconBrandGithub size={12} className="opacity-0" />
                Lichess · {student.lichessUsername}
              </Badge>
            )}
          </div>

          {games.length > 0 ? (
            <div className="flex flex-col gap-2">
              <RecordBar record={stats.overall} />
              <div className="flex items-center justify-between">
                <RecordLegend record={stats.overall} />
                <FormDots results={stats.recentForm} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {fetchedAt ? "Sin partidas el último mes." : "Aún sin sincronizar — ábrelo para cargar."}
            </p>
          )}

          {alerts.length > 0 && games.length > 0 && <AlertBadges alerts={alerts} />}

          <p className="mt-auto text-xs text-muted-foreground">
            {fetchedAt
              ? `Actualizado ${formatRelative(fetchedAt)} · ${games.length} partidas`
              : "Sin sincronizar"}
            {tactics ? ` · ${tactics.passed} puzzles` : ""}
            {accuracy != null ? ` (${accuracy}% acierto)` : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
