import type {
  CurrentRatings,
  Game,
  GameResult,
  Tactics,
  Termination,
  TimeClass,
} from "@/types";

const BASE = "https://api.chess.com/pub";

// Endpoint interno de Chess.com (con conteos de táctica) vía el proxy de Vite,
// porque no tiene CORS. Ver vite.config.ts.
const CALLBACK = "/cc-callback";

// Errores de dominio distinguibles por la UI.
export class UserNotFoundError extends Error {}

interface ChesscomPlayerSide {
  username: string;
  rating?: number;
  result: string;
}

interface ChesscomGame {
  url: string;
  pgn?: string;
  time_control: string;
  time_class: string;
  rated: boolean;
  end_time: number;
  eco?: string;
  white: ChesscomPlayerSide;
  black: ChesscomPlayerSide;
}

const DRAW_CODES = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

function terminationFromCode(code: string): Termination {
  switch (code) {
    case "checkmated":
      return "checkmate";
    case "resigned":
      return "resignation";
    case "timeout":
      return "timeout";
    case "abandoned":
      return "abandoned";
    case "agreed":
      return "agreement";
    case "repetition":
      return "repetition";
    case "stalemate":
      return "stalemate";
    case "insufficient":
    case "timevsinsufficient":
      return "insufficient";
    case "50move":
      return "fifty-move";
    default:
      return "other";
  }
}

function classify(
  myCode: string,
  oppCode: string,
): { result: GameResult; termination: Termination } {
  if (myCode === "win") {
    return { result: "win", termination: terminationFromCode(oppCode) };
  }
  if (DRAW_CODES.has(myCode)) {
    return { result: "draw", termination: terminationFromCode(myCode) };
  }
  return { result: "loss", termination: terminationFromCode(myCode) };
}

function normalizeTimeClass(tc: string): TimeClass {
  switch (tc) {
    case "bullet":
      return "bullet";
    case "blitz":
      return "blitz";
    case "rapid":
      return "rapid";
    case "daily":
      return "daily";
    default:
      return "blitz";
  }
}

// Extrae el nombre de la apertura desde la URL de ECO de chess.com.
function openingFromEcoUrl(ecoUrl?: string): string | undefined {
  if (!ecoUrl) return undefined;
  const slug = ecoUrl.split("/").pop();
  if (!slug) return undefined;
  return slug.replace(/-/g, " ").replace(/\.\.\..*$/, "").trim();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) throw new UserNotFoundError();
  if (res.status === 429) {
    throw new Error("Chess.com limitó las peticiones. Intenta de nuevo en un momento.");
  }
  if (!res.ok) throw new Error(`Chess.com respondió ${res.status}.`);
  // Algunos endpoints devuelven 200 con cuerpo vacío.
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}

// Descarga las partidas de un usuario dentro de la ventana [sinceMs, ahora].
export async function fetchChesscomGames(
  username: string,
  studentId: string,
  sinceMs: number,
): Promise<Game[]> {
  const user = username.trim().toLowerCase();
  const archives = await fetchJson<{ archives: string[] }>(
    `${BASE}/player/${encodeURIComponent(user)}/games/archives`,
  );
  const urls = archives?.archives ?? [];
  // Los dos últimos meses cubren cualquier ventana de ~30 días.
  const recent = urls.slice(-2);
  const games: Game[] = [];

  for (const monthUrl of recent) {
    const data = await fetchJson<{ games: ChesscomGame[] }>(monthUrl);
    for (const g of data?.games ?? []) {
      const playedAt = g.end_time * 1000;
      if (playedAt < sinceMs) continue;

      const iAmWhite = g.white.username.toLowerCase() === user;
      const me = iAmWhite ? g.white : g.black;
      const opp = iAmWhite ? g.black : g.white;
      const { result, termination } = classify(me.result, opp.result);

      games.push({
        id: `cc-${g.url.split("/").pop() ?? g.end_time}`,
        source: "chesscom",
        studentId,
        playedAt,
        timeClass: normalizeTimeClass(g.time_class),
        timeControl: g.time_control,
        rated: g.rated,
        color: iAmWhite ? "white" : "black",
        playerRating: me.rating ?? null,
        opponent: opp.username,
        opponentRating: opp.rating ?? null,
        result,
        termination,
        eco: g.eco,
        opening: openingFromEcoUrl(g.eco),
        pgn: g.pgn ?? "",
        url: g.url,
      });
    }
  }

  return games;
}

// Táctica/puzzles del usuario (histórico): intentados, acertados, fallados y
// rating. Datos reales del endpoint interno de Chess.com. Devuelve null si no
// hay datos o el proxy no está disponible (p. ej. build estático).
export async function fetchChesscomTactics(
  username: string,
): Promise<Tactics | null> {
  try {
    const res = await fetch(
      `${CALLBACK}/member/stats/${encodeURIComponent(username.trim().toLowerCase())}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      stats?: { key: string; stats: Record<string, number> }[];
    };
    const t = data.stats?.find((s) => s.key === "tactics")?.stats;
    if (!t) return null;
    return {
      rating: t.rating ?? t.highest_rating ?? null,
      attempted: t.attempt_count ?? 0,
      passed: t.passed_count ?? 0,
      failed: t.failed_count ?? 0,
    };
  } catch {
    return null;
  }
}

export async function fetchChesscomRatings(
  username: string,
): Promise<CurrentRatings["chesscom"]> {
  const user = username.trim().toLowerCase();
  const stats = await fetchJson<Record<string, { last?: { rating?: number } }>>(
    `${BASE}/player/${encodeURIComponent(user)}/stats`,
  );
  if (!stats) return {};
  const out: Partial<Record<TimeClass, number>> = {};
  if (stats.chess_bullet?.last?.rating) out.bullet = stats.chess_bullet.last.rating;
  if (stats.chess_blitz?.last?.rating) out.blitz = stats.chess_blitz.last.rating;
  if (stats.chess_rapid?.last?.rating) out.rapid = stats.chess_rapid.last.rating;
  if (stats.chess_daily?.last?.rating) out.daily = stats.chess_daily.last.rating;
  return out;
}
