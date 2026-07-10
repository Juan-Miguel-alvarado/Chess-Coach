import { useState } from "react";
import type { Record3 } from "@/lib/stats/deriveStats";
import { cn } from "@/lib/utils";

export type SegKey = "wins" | "draws" | "losses";

export const RESULT_SEGMENTS: {
  key: SegKey;
  label: string;
  fill: string;
  text: string;
}[] = [
  { key: "wins", label: "Victorias", fill: "bg-win", text: "text-win" },
  { key: "draws", label: "Tablas", fill: "bg-draw", text: "text-draw" },
  { key: "losses", label: "Derrotas", fill: "bg-loss", text: "text-loss" },
];

export function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// Barra apilada victoria/tablas/derrota, interactiva: al pasar el cursor (o
// enfocar con teclado) por un segmento, muestra el dato exacto debajo y atenúa
// los demás. Compartida por color, ritmo y aperturas.
export function ResultBar({
  record,
  widthPercent,
}: {
  record: Record3;
  widthPercent?: number;
}) {
  // `hovered` = puntero encima (escritorio); `pinned` = tocado con click/tap
  // (móvil, se queda fijo). Se muestra el que tenga el cursor o, si no, el fijado.
  const [hovered, setHovered] = useState<SegKey | null>(null);
  const [pinned, setPinned] = useState<SegKey | null>(null);
  const shown = hovered ?? pinned;
  const total = record.games || record.wins + record.draws + record.losses || 1;
  const active = shown ? RESULT_SEGMENTS.find((s) => s.key === shown)! : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-[10px] gap-[2px]"
        style={widthPercent != null ? { width: `${widthPercent}%` } : undefined}
      >
        {RESULT_SEGMENTS.map((s) => {
          const value = record[s.key];
          if (value <= 0) return null;
          return (
            <button
              key={s.key}
              type="button"
              aria-label={`${s.label}: ${value} (${pct(value, total)}%)`}
              aria-pressed={pinned === s.key}
              // Sólo el ratón activa por hover; en táctil se ignora para que el
              // tap (onClick) controle el detalle sin quedarse "pegado".
              onPointerEnter={(e) =>
                e.pointerType === "mouse" && setHovered(s.key)
              }
              onPointerLeave={(e) =>
                e.pointerType === "mouse" && setHovered(null)
              }
              onClick={() => setPinned((p) => (p === s.key ? null : s.key))}
              className={cn(
                "h-full min-w-[10px] rounded-md outline-none transition-[filter,opacity] focus-visible:ring-2 focus-visible:ring-ring",
                s.fill,
                shown && shown !== s.key ? "opacity-40" : "hover:brightness-110",
              )}
              style={{ flexGrow: value }}
            />
          );
        })}
      </div>
      <div className="min-h-4 text-xs tabular-nums">
        {active ? (
          <span className={cn("font-medium", active.text)}>
            {active.label}: {record[active.key]} (
            {pct(record[active.key], total)}%)
          </span>
        ) : (
          <span className="flex items-center gap-3 text-muted-foreground">
            <span>{record.wins}V</span>
            <span>{record.draws}T</span>
            <span>{record.losses}D</span>
          </span>
        )}
      </div>
    </div>
  );
}
