import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconPlus,
  IconRefresh,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Student } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { studentRepository, gameCacheRepository } from "@/lib/repositories";
import { fetchStudentGames } from "@/lib/api/fetchStudentGames";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StudentCard } from "@/components/StudentCard";

export function Dashboard() {
  const { teacher } = useAuth();
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncKey, setSyncKey] = useState(0); // fuerza remonte de las tarjetas

  const students = useMemo<Student[]>(
    () => (teacher ? studentRepository.list(teacher.id) : []),
    [teacher, syncKey],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.chesscomUsername?.toLowerCase().includes(q) ||
        s.lichessUsername?.toLowerCase().includes(q),
    );
  }, [students, query]);

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
          // continúa con el resto de alumnos
        }
      }
      setSyncKey((k) => k + 1);
      toast.success("Alumnos sincronizados");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis alumnos</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} alumno{students.length === 1 ? "" : "s"} · partidas del último mes
          </p>
        </div>
        <div className="flex gap-2">
          {students.length > 0 && (
            <Button variant="outline" onClick={syncAll} disabled={syncing}>
              <IconRefresh
                size={16}
                className={syncing ? "animate-spin" : undefined}
              />
              {syncing ? "Sincronizando…" : "Sincronizar todos"}
            </Button>
          )}
          <Button asChild>
            <Link to="/students/new">
              <IconPlus size={16} /> Agregar alumno
            </Link>
          </Button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="relative max-w-sm">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nombre o usuario…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {students.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún alumno coincide con «{query}».
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <StudentCard key={`${s.id}-${syncKey}`} student={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <IconUsers size={24} />
        </span>
        <div>
          <h3 className="font-semibold">Aún no tienes alumnos</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Agrega tu primer alumno con su usuario de Chess.com o Lichess para
            empezar a ver sus estadísticas.
          </p>
        </div>
        <Button asChild>
          <Link to="/students/new">
            <IconPlus size={16} /> Agregar alumno
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
