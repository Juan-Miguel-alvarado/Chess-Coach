import type { GameResult } from "@/types";
import { cn } from "@/lib/utils";

const COLORS: Record<GameResult, string> = {
  win: "bg-win",
  draw: "bg-draw",
  loss: "bg-loss",
};

// Muestra la forma reciente (más reciente a la izquierda).
export function FormDots({ results, max = 8 }: { results: GameResult[]; max?: number }) {
  const shown = results.slice(0, max);
  if (shown.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin partidas</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {shown.map((r, i) => (
        <span
          key={i}
          className={cn("size-2.5 rounded-full", COLORS[r])}
          title={r}
        />
      ))}
    </div>
  );
}
