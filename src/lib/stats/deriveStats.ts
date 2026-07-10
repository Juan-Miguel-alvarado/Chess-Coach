import type {
  Game,
  GameResult,
  GameSource,
  PieceColor,
  Termination,
  TimeClass,
} from "@/types";

export interface Record3 {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0..100
}

export interface RatingPoint {
  playedAt: number;
  rating: number;
  timeClass: TimeClass;
  source: GameSource;
}

export interface OpeningStat {
  name: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Streak {
  type: GameResult | null;
  count: number;
}

export interface DerivedStats {
  overall: Record3;
  byColor: Record<PieceColor, Record3>;
  byTimeClass: Partial<Record<TimeClass, Record3>>;
  winTerminations: { termination: Termination; count: number }[];
  lossTerminations: { termination: Termination; count: number }[];
  recentForm: GameResult[]; // más reciente primero
  currentStreak: Streak;
  ratingTimeline: RatingPoint[];
  openings: OpeningStat[];
  avgOpponentRating: number | null;
  lastPlayedAt: number | null;
}

function emptyRecord(): Record3 {
  return { games: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
}

function tally(rec: Record3, result: GameResult): void {
  rec.games += 1;
  if (result === "win") rec.wins += 1;
  else if (result === "loss") rec.losses += 1;
  else rec.draws += 1;
}

function finalizeWinRate(rec: Record3): void {
  rec.winRate = rec.games > 0 ? Math.round((rec.wins / rec.games) * 100) : 0;
}

function topTerminations(
  games: Game[],
  result: GameResult,
): { termination: Termination; count: number }[] {
  const counts = new Map<Termination, number>();
  for (const g of games) {
    if (g.result !== result) continue;
    counts.set(g.termination, (counts.get(g.termination) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([termination, count]) => ({ termination, count }))
    .sort((a, b) => b.count - a.count);
}

export function deriveStats(games: Game[]): DerivedStats {
  const overall = emptyRecord();
  const byColor: Record<PieceColor, Record3> = {
    white: emptyRecord(),
    black: emptyRecord(),
  };
  const byTimeClass: Partial<Record<TimeClass, Record3>> = {};
  const openingMap = new Map<string, OpeningStat>();

  let opponentRatingSum = 0;
  let opponentRatingCount = 0;

  for (const g of games) {
    tally(overall, g.result);
    tally(byColor[g.color], g.result);

    const tc = (byTimeClass[g.timeClass] ??= emptyRecord());
    tally(tc, g.result);

    if (g.opponentRating != null) {
      opponentRatingSum += g.opponentRating;
      opponentRatingCount += 1;
    }

    const openingName = g.opening?.trim();
    if (openingName) {
      const o =
        openingMap.get(openingName) ??
        { name: openingName, games: 0, wins: 0, losses: 0, draws: 0 };
      o.games += 1;
      if (g.result === "win") o.wins += 1;
      else if (g.result === "loss") o.losses += 1;
      else o.draws += 1;
      openingMap.set(openingName, o);
    }
  }

  finalizeWinRate(overall);
  finalizeWinRate(byColor.white);
  finalizeWinRate(byColor.black);
  for (const rec of Object.values(byTimeClass)) finalizeWinRate(rec);

  // Cronológico ascendente para la línea de rating.
  const chronological = [...games].sort((a, b) => a.playedAt - b.playedAt);
  const ratingTimeline: RatingPoint[] = chronological
    .filter((g) => g.playerRating != null)
    .map((g) => ({
      playedAt: g.playedAt,
      rating: g.playerRating as number,
      timeClass: g.timeClass,
      source: g.source,
    }));

  // Racha actual y forma reciente (games ya viene ordenado desc por el fetch,
  // pero no dependemos de ello).
  const recentDesc = [...games].sort((a, b) => b.playedAt - a.playedAt);
  const recentForm = recentDesc.slice(0, 12).map((g) => g.result);
  const currentStreak: Streak = { type: null, count: 0 };
  for (const g of recentDesc) {
    if (currentStreak.type === null) {
      currentStreak.type = g.result;
      currentStreak.count = 1;
    } else if (g.result === currentStreak.type) {
      currentStreak.count += 1;
    } else {
      break;
    }
  }

  return {
    overall,
    byColor,
    byTimeClass,
    winTerminations: topTerminations(games, "win"),
    lossTerminations: topTerminations(games, "loss"),
    recentForm,
    currentStreak,
    ratingTimeline,
    openings: [...openingMap.values()]
      .sort((a, b) => b.games - a.games)
      .slice(0, 8),
    avgOpponentRating:
      opponentRatingCount > 0
        ? Math.round(opponentRatingSum / opponentRatingCount)
        : null,
    lastPlayedAt: recentDesc[0]?.playedAt ?? null,
  };
}
