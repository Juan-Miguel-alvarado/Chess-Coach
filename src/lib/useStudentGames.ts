import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrentRatings, Game, GameSource, Student } from "@/types";
import { gameCacheRepository } from "@/lib/repositories";
import { fetchStudentGames } from "@/lib/api/fetchStudentGames";

const STALE_MS = 6 * 60 * 60 * 1000; // 6 horas
const AUTO_SYNC_MS = 3 * 60 * 1000; // sincronización automática cada 3 minutos

export interface UseStudentGames {
  games: Game[];
  ratings: CurrentRatings;
  errors: Partial<Record<GameSource, string>>;
  loading: boolean;
  fetchedAt: number | null;
  refresh: () => Promise<void>;
}

// Carga las partidas de un alumno usando la caché de localStorage y, si procede,
// las descarga de las APIs. `auto` re-descarga si la caché está vencida.
export function useStudentGames(
  student: Student | null,
  auto = true,
): UseStudentGames {
  const [games, setGames] = useState<Game[]>([]);
  const [ratings, setRatings] = useState<CurrentRatings>({});
  const [errors, setErrors] = useState<Partial<Record<GameSource, string>>>({});
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!student || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const result = await fetchStudentGames(student);
      setGames(result.games);
      setRatings(result.ratings);
      setErrors(result.errors);
      const now = Date.now();
      setFetchedAt(now);
      gameCacheRepository.set({
        studentId: student.id,
        fetchedAt: now,
        games: result.games,
        ratings: result.ratings,
        errors: result.errors,
      });
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const cached = gameCacheRepository.get(student.id);
    if (cached) {
      setGames(cached.games);
      setRatings(cached.ratings ?? {});
      setErrors(cached.errors ?? {});
      setFetchedAt(cached.fetchedAt);
    } else {
      setGames([]);
      setRatings({});
      setErrors({});
      setFetchedAt(null);
    }
    const stale = !cached || Date.now() - cached.fetchedAt > STALE_MS;
    if (auto && stale) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  // Sincronización automática cada 3 minutos mientras se ve al alumno (auto).
  // Sólo re-descarga con la pestaña visible, para no gastar peticiones en balde.
  // Ref al último `refresh` para que el intervalo sea estable (anclado al id del
  // alumno) y no se reinicie en cada render.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!auto || !student?.id) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refreshRef.current();
    }, AUTO_SYNC_MS);
    return () => clearInterval(interval);
  }, [auto, student?.id]);

  return { games, ratings, errors, loading, fetchedAt, refresh };
}
