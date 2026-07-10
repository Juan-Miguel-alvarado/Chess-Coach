import { RESULT_SEGMENTS } from "@/components/stats/ResultBar";
import { cn } from "@/lib/utils";

// Leyenda compartida victoria/tablas/derrota.
export function ResultLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {RESULT_SEGMENTS.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", s.fill)} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
