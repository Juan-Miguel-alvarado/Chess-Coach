import type { Record3 } from "@/lib/stats/deriveStats";
import { cn } from "@/lib/utils";

// Barra apilada victorias / tablas / derrotas.
export function RecordBar({ record, className }: { record: Record3; className?: string }) {
  const total = record.games || 1;
  const w = (record.wins / total) * 100;
  const d = (record.draws / total) * 100;
  const l = (record.losses / total) * 100;
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="bg-win" style={{ width: `${w}%` }} />
      <div className="bg-draw" style={{ width: `${d}%` }} />
      <div className="bg-loss" style={{ width: `${l}%` }} />
    </div>
  );
}

export function RecordLegend({ record }: { record: Record3 }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="size-2 rounded-full bg-win" /> {record.wins}V
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2 rounded-full bg-draw" /> {record.draws}T
      </span>
      <span className="flex items-center gap-1">
        <span className="size-2 rounded-full bg-loss" /> {record.losses}D
      </span>
    </div>
  );
}
