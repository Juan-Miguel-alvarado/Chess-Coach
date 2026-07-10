import type { CurrentRatings, Game, GameSource, Student } from "@/types";
import {
  UserNotFoundError,
  fetchChesscomGames,
  fetchChesscomRatings,
} from "./chesscom";
import { fetchLichessGames, fetchLichessRatings } from "./lichess";

export const DEFAULT_WINDOW_DAYS = 30;

export interface StudentGamesResult {
  games: Game[];
  ratings: CurrentRatings;
  errors: Partial<Record<GameSource, string>>;
}

function messageFor(source: GameSource, err: unknown): string {
  if (err instanceof UserNotFoundError) {
    return source === "chesscom"
      ? "Usuario de Chess.com no encontrado."
      : "Usuario de Lichess no encontrado.";
  }
  return err instanceof Error ? err.message : "Error desconocido.";
}

// Descarga y unifica las partidas del alumno desde ambas fuentes. Cada fuente
// falla de forma independiente: si Lichess falla, se muestran igual las de
// Chess.com (y viceversa).
export async function fetchStudentGames(
  student: Student,
  windowDays = DEFAULT_WINDOW_DAYS,
): Promise<StudentGamesResult> {
  const sinceMs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const games: Game[] = [];
  const ratings: CurrentRatings = {};
  const errors: Partial<Record<GameSource, string>> = {};

  const tasks: Promise<void>[] = [];

  if (student.chesscomUsername?.trim()) {
    const username = student.chesscomUsername.trim();
    tasks.push(
      (async () => {
        try {
          const [g, r] = await Promise.all([
            fetchChesscomGames(username, student.id, sinceMs),
            fetchChesscomRatings(username).catch(() => ({})),
          ]);
          games.push(...g);
          ratings.chesscom = r;
        } catch (err) {
          errors.chesscom = messageFor("chesscom", err);
        }
      })(),
    );
  }

  if (student.lichessUsername?.trim()) {
    const username = student.lichessUsername.trim();
    tasks.push(
      (async () => {
        try {
          const [g, r] = await Promise.all([
            fetchLichessGames(username, student.id, sinceMs),
            fetchLichessRatings(username).catch(() => ({})),
          ]);
          games.push(...g);
          ratings.lichess = r;
        } catch (err) {
          errors.lichess = messageFor("lichess", err);
        }
      })(),
    );
  }

  await Promise.all(tasks);
  games.sort((a, b) => b.playedAt - a.playedAt);

  return { games, ratings, errors };
}
