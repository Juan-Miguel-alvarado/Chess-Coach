import type { Game } from "@/types";
import { deriveStats } from "./deriveStats";

export type AlertLevel = "warning" | "info" | "positive";

export interface StudentAlert {
  level: AlertLevel;
  message: string;
}

// Señales accionables para que el profesor priorice a quién revisar.
export function deriveAlerts(games: Game[]): StudentAlert[] {
  const alerts: StudentAlert[] = [];
  if (games.length === 0) {
    alerts.push({ level: "info", message: "Sin partidas en el último mes" });
    return alerts;
  }

  const stats = deriveStats(games);

  if (stats.currentStreak.type === "loss" && stats.currentStreak.count >= 3) {
    alerts.push({
      level: "warning",
      message: `Racha de ${stats.currentStreak.count} derrotas`,
    });
  }
  if (stats.currentStreak.type === "win" && stats.currentStreak.count >= 3) {
    alerts.push({
      level: "positive",
      message: `Racha de ${stats.currentStreak.count} victorias`,
    });
  }

  // Caída de rating: compara el primer y último rating disponible de cada ritmo.
  const byTc = new Map<string, { first: number; last: number }>();
  for (const p of stats.ratingTimeline) {
    const entry = byTc.get(p.timeClass);
    if (!entry) byTc.set(p.timeClass, { first: p.rating, last: p.rating });
    else entry.last = p.rating;
  }
  let maxDrop = 0;
  for (const { first, last } of byTc.values()) {
    maxDrop = Math.max(maxDrop, first - last);
  }
  if (maxDrop >= 40) {
    alerts.push({ level: "warning", message: `Bajó ${maxDrop} pts de rating` });
  }

  // Inactividad.
  if (stats.lastPlayedAt) {
    const days = Math.floor(
      (Date.now() - stats.lastPlayedAt) / (24 * 60 * 60 * 1000),
    );
    if (days >= 10) {
      alerts.push({ level: "info", message: `Inactivo hace ${days} días` });
    }
  }

  return alerts;
}
