import type { Game, Student, Tactics, TimeClass } from "@/types";
import { gameCacheRepository } from "@/lib/repositories";
import { deriveStats } from "./deriveStats";
import type { Streak } from "./deriveStats";

export interface StudentSummary {
  student: Student;
  games: number;
  puzzles: number | null; // puzzles de táctica acertados (Chess.com, histórico)
  puzzleAccuracy: number | null; // % de acierto en táctica
  winRate: number;
  wins: number;
  draws: number;
  losses: number;
  streak: Streak;
  ratingChange: number | null; // variación en el ritmo con más partidas
  hasCache: boolean;
}

function ratingChangeFrom(games: Game[]): number | null {
  const stats = deriveStats(games);
  const byTc = new Map<TimeClass, number[]>();
  for (const p of stats.ratingTimeline) {
    const arr = byTc.get(p.timeClass) ?? [];
    arr.push(p.rating);
    byTc.set(p.timeClass, arr);
  }
  // Ritmo con más puntos de rating.
  let best: number[] | null = null;
  for (const arr of byTc.values()) {
    if (!best || arr.length > best.length) best = arr;
  }
  if (!best || best.length < 2) return null;
  return best[best.length - 1] - best[0];
}

export function summarize(
  student: Student,
  games: Game[],
  tactics: Tactics | null,
  hasCache: boolean,
): StudentSummary {
  const stats = deriveStats(games);
  const accuracy =
    tactics && tactics.attempted > 0
      ? Math.round((tactics.passed / tactics.attempted) * 100)
      : null;
  return {
    student,
    games: games.length,
    puzzles: tactics ? tactics.passed : null,
    puzzleAccuracy: accuracy,
    winRate: stats.overall.winRate,
    wins: stats.overall.wins,
    draws: stats.overall.draws,
    losses: stats.overall.losses,
    streak: stats.currentStreak,
    ratingChange: ratingChangeFrom(games),
    hasCache,
  };
}

// Carga los resúmenes de todos los alumnos desde la caché (sin golpear las APIs).
export function loadSummaries(students: Student[]): StudentSummary[] {
  return students.map((s) => {
    const cache = gameCacheRepository.get(s.id);
    return summarize(s, cache?.games ?? [], cache?.tactics ?? null, Boolean(cache));
  });
}

// Alumno con el valor máximo (>0) para una métrica; null si nadie tiene datos.
export function leaderBy(
  summaries: StudentSummary[],
  pick: (s: StudentSummary) => number,
  minGames = 0,
): StudentSummary | null {
  let best: StudentSummary | null = null;
  for (const s of summaries) {
    if (s.games < minGames) continue;
    const v = pick(s);
    if (v <= 0) continue;
    if (!best || v > pick(best)) best = s;
  }
  return best;
}
