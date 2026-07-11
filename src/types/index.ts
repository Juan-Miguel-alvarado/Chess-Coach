// Dominio de la plataforma. Tipos compartidos por toda la app.

export type GameSource = "chesscom" | "lichess";

export type TimeClass = "bullet" | "blitz" | "rapid" | "daily" | "classical";

export type PieceColor = "white" | "black";

export type GameResult = "win" | "loss" | "draw";

// Forma normalizada en que terminó la partida (unificando Chess.com y Lichess).
export type Termination =
  | "checkmate"
  | "resignation"
  | "timeout"
  | "abandoned"
  | "agreement"
  | "stalemate"
  | "insufficient"
  | "repetition"
  | "fifty-move"
  | "other";

export interface Teacher {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // hash SHA-256 (no es seguridad real; se reemplaza por Supabase Auth)
  createdAt: number;
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  age: number | null;
  chesscomUsername?: string;
  lichessUsername?: string;
  notes?: string;
  createdAt: number;
}

// Táctica/puzzles de Chess.com (histórico de la cuenta). Datos reales del
// endpoint de estadísticas; `attempted`/`passed`/`failed` son acumulados.
export interface Tactics {
  rating: number | null;
  attempted: number;
  passed: number;
  failed: number;
}

// Partida normalizada, independiente de la fuente.
export interface Game {
  id: string;
  source: GameSource;
  studentId: string;
  playedAt: number; // epoch ms
  timeClass: TimeClass;
  timeControl: string;
  rated: boolean;
  color: PieceColor;
  playerRating: number | null;
  opponent: string;
  opponentRating: number | null;
  result: GameResult;
  termination: Termination;
  eco?: string;
  opening?: string;
  pgn: string;
  url: string;
}

export interface GameCache {
  studentId: string;
  fetchedAt: number;
  games: Game[];
  ratings?: CurrentRatings;
  tactics?: Tactics;
  errors?: Partial<Record<GameSource, string>>;
}

// Rating actual por ritmo, tomado de los endpoints de perfil.
export interface CurrentRatings {
  chesscom?: Partial<Record<TimeClass, number>>;
  lichess?: Partial<Record<TimeClass, number>>;
}
