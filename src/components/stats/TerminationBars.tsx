import { useState } from "react";
import type { Termination } from "@/types";
import { TERMINATION_LABELS } from "@/lib/labels";
import { pct } from "@/components/stats/ResultBar";
import { cn } from "@/lib/utils";

interface Item {
  termination: string;
  count: number;
}

// Lista interactiva de formas de término (cómo gana / cómo pierde). Al pasar el
// cursor por una fila revela el % sobre el total y atenúa las demás.
export function TerminationBars({
  items,
  tone,
}: {
  items: Item[];
  tone: "win" | "loss";
}) {
  // `hovered` (ratón) y `pinned` (tap/click). Ver ResultBar para el porqué.
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const shown = hovered ?? pinned;
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  const max = Math.max(...items.map((i) => i.count), 1);
  const fill = tone === "win" ? "bg-win" : "bg-loss";
  const text = tone === "win" ? "text-win" : "text-loss";

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((i) => {
        const isShown = shown === i.termination;
        const label =
          TERMINATION_LABELS[i.termination as Termination] ?? i.termination;
        return (
          <button
            key={i.termination}
            type="button"
            aria-label={`${label}: ${i.count} (${pct(i.count, total)}%)`}
            aria-pressed={pinned === i.termination}
            onPointerEnter={(e) =>
              e.pointerType === "mouse" && setHovered(i.termination)
            }
            onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
            onClick={() =>
              setPinned((p) => (p === i.termination ? null : i.termination))
            }
            className={cn(
              "-mx-1.5 flex flex-col gap-1 rounded-md px-1.5 py-1.5 text-left outline-none transition-[background,opacity] hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
              shown && !isShown && "opacity-40",
            )}
          >
            <div className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="tabular-nums text-muted-foreground">
                {i.count}
                {isShown && (
                  <span className={cn("ml-1 font-medium", text)}>
                    ({pct(i.count, total)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-[10px] w-full overflow-hidden rounded-md bg-muted">
              <div
                className={cn(
                  "h-full rounded-md transition-[filter]",
                  fill,
                  isShown && "brightness-110",
                )}
                style={{ width: `${(i.count / max) * 100}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
