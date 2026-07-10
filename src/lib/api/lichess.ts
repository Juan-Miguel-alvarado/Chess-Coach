import type {
  CurrentRatings,
  Game,
  GameResult,
  PieceColor,
  Termination,
  TimeClass,
} from "@/types";
import { UserNotFoundError } from "./chesscom";

const BASE = "https://lichess.org";

interface LichessPlayer {
  user?: { name: string; id: string };
  rating?: number;
}

interface LichessGame {
  id: string;
  rated: boolean;
  speed: string;
  createdAt: number;
  status: string;
  winner?: PieceColor;
  players: { white: LichessPlayer; black: LichessPlayer };
  opening?: { eco?: string; name?: string };
  clock?: { initial: number; increment: number };
  daysPerTurn?: number;
  pgn?: string;
}

function terminationFromStatus(status: string): Termination {
  switch (status) {
    case "mate":
      return "checkmate";
    case "resign":
      return "resignation";
    case "outoftime":
      return "timeout";
    case "stalemate":
      return "stalemate";
    case "draw":
      return "agreement";
    case "timeout":
    case "noStart":
      return "abandoned";
    default:
      return "other";
  }
}

function normalizeTimeClass(speed: string): TimeClass {
  switch (speed) {
    case "ultraBullet":
    case "bullet":
      return "bullet";
    case "blitz":
      return "blitz";
    case "rapid":
      return "rapid";
    case "classical":
      return "classical";
    case "correspondence":
      return "daily";
    default:
      return "blitz";
  }
}

function timeControlLabel(g: LichessGame): string {
  if (g.clock) return `${Math.round(g.clock.initial / 60)}+${g.clock.increment}`;
  if (g.daysPerTurn) return `${g.daysPerTurn}d`;
  return "correspondencia";
}

function parseNdjson<T>(text: string): T[] {
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

export async function fetchLichessGames(
  username: string,
  studentId: string,
  sinceMs: number,
): Promise<Game[]> {
  const user = username.trim();
  const params = new URLSearchParams({
    since: String(sinceMs),
    max: "200",
    pgnInJson: "true",
    opening: "true",
    sort: "dateDesc",
    clocks: "false",
    evals: "false",
  });
  const res = await fetch(
    `${BASE}/api/games/user/${encodeURIComponent(user)}?${params.toString()}`,
    { headers: { Accept: "application/x-ndjson" } },
  );
  if (res.status === 404) throw new UserNotFoundError();
  if (res.status === 429) {
    throw new Error("Lichess limitó las peticiones. Intenta de nuevo en un momento.");
  }
  if (!res.ok) throw new Error(`Lichess respondió ${res.status}.`);

  const text = await res.text();
  const raw = parseNdjson<LichessGame>(text);
  const lower = user.toLowerCase();

  return raw.map((g) => {
    const iAmWhite = g.players.white.user?.name?.toLowerCase() === lower;
    const me = iAmWhite ? g.players.white : g.players.black;
    const opp = iAmWhite ? g.players.black : g.players.white;
    const color: PieceColor = iAmWhite ? "white" : "black";

    let result: GameResult;
    if (!g.winner) result = "draw";
    else result = g.winner === color ? "win" : "loss";

    return {
      id: `li-${g.id}`,
      source: "lichess" as const,
      studentId,
      playedAt: g.createdAt,
      timeClass: normalizeTimeClass(g.speed),
      timeControl: timeControlLabel(g),
      rated: g.rated,
      color,
      playerRating: me.rating ?? null,
      opponent: opp.user?.name ?? "Anónimo",
      opponentRating: opp.rating ?? null,
      result,
      termination: terminationFromStatus(g.status),
      eco: g.opening?.eco,
      opening: g.opening?.name,
      pgn: g.pgn ?? "",
      url: `${BASE}/${g.id}`,
    };
  });
}

export async function fetchLichessRatings(
  username: string,
): Promise<CurrentRatings["lichess"]> {
  const res = await fetch(
    `${BASE}/api/user/${encodeURIComponent(username.trim())}`,
  );
  if (res.status === 404) throw new UserNotFoundError();
  if (!res.ok) throw new Error(`Lichess respondió ${res.status}.`);
  const data = (await res.json()) as {
    perfs?: Record<string, { rating?: number }>;
  };
  const perfs = data.perfs ?? {};
  const out: Partial<Record<TimeClass, number>> = {};
  if (perfs.bullet?.rating) out.bullet = perfs.bullet.rating;
  if (perfs.blitz?.rating) out.blitz = perfs.blitz.rating;
  if (perfs.rapid?.rating) out.rapid = perfs.rapid.rating;
  if (perfs.classical?.rating) out.classical = perfs.classical.rating;
  if (perfs.correspondence?.rating) out.daily = perfs.correspondence.rating;
  return out;
}
