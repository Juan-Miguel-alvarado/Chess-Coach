import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RatingPoint } from "@/lib/stats/deriveStats";
import type { TimeClass } from "@/types";
import { TIME_CLASS_LABELS, formatDate } from "@/lib/labels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RatingChart({ timeline }: { timeline: RatingPoint[] }) {
  // Ritmos disponibles ordenados por número de puntos.
  const byClass = useMemo(() => {
    const map = new Map<TimeClass, RatingPoint[]>();
    for (const p of timeline) {
      const arr = map.get(p.timeClass) ?? [];
      arr.push(p);
      map.set(p.timeClass, arr);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [timeline]);

  const [selected, setSelected] = useState<TimeClass | null>(
    byClass[0]?.[0] ?? null,
  );

  const data = useMemo(() => {
    const tc = selected ?? byClass[0]?.[0];
    const points = byClass.find(([c]) => c === tc)?.[1] ?? [];
    return points.map((p, i) => ({ i, rating: p.rating, playedAt: p.playedAt }));
  }, [selected, byClass]);

  if (byClass.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay datos de rating para graficar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Select
          value={(selected ?? byClass[0][0]) as string}
          onValueChange={(v) => setSelected(v as TimeClass)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {byClass.map(([tc, pts]) => (
              <SelectItem key={tc} value={tc}>
                {TIME_CLASS_LABELS[tc]} ({pts.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="i" hide />
          <YAxis
            domain={["dataMin - 20", "dataMax + 20"]}
            tick={{ fontSize: 12 }}
            width={44}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { playedAt?: number } | undefined;
              return p?.playedAt ? formatDate(p.playedAt) : "";
            }}
            formatter={(value) => [value as number, "Rating"]}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
