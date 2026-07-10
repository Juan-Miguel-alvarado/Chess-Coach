import type {
  GameResult,
  GameSource,
  PieceColor,
  Termination,
  TimeClass,
} from "@/types";

export const TERMINATION_LABELS: Record<Termination, string> = {
  checkmate: "Jaque mate",
  resignation: "Rendición",
  timeout: "Se acabó el tiempo",
  abandoned: "Abandono",
  agreement: "Tablas acordadas",
  stalemate: "Ahogado",
  insufficient: "Material insuficiente",
  repetition: "Repetición",
  "fifty-move": "Regla de 50 jugadas",
  other: "Otro",
};

export const TIME_CLASS_LABELS: Record<TimeClass, string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rápidas",
  daily: "Por días",
  classical: "Clásicas",
};

export const RESULT_LABELS: Record<GameResult, string> = {
  win: "Victoria",
  loss: "Derrota",
  draw: "Tablas",
};

export const COLOR_LABELS: Record<PieceColor, string> = {
  white: "Blancas",
  black: "Negras",
};

export const SOURCE_LABELS: Record<GameSource, string> = {
  chesscom: "Chess.com",
  lichess: "Lichess",
};

const dateFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(ms: number): string {
  return dateFmt.format(new Date(ms));
}

export function formatDateTime(ms: number): string {
  return dateTimeFmt.format(new Date(ms));
}

export function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
  return formatDate(ms);
}
