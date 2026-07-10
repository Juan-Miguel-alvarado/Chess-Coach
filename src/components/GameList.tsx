import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconExternalLink } from "@tabler/icons-react";
import type { Game, GameResult, PieceColor, TimeClass } from "@/types";
import {
  COLOR_LABELS,
  RESULT_LABELS,
  SOURCE_LABELS,
  TERMINATION_LABELS,
  TIME_CLASS_LABELS,
  formatDateTime,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const RESULT_STYLES: Record<GameResult, string> = {
  win: "border-win/30 bg-win/10 text-win",
  loss: "border-loss/30 bg-loss/10 text-loss",
  draw: "border-draw/30 bg-draw/10 text-draw",
};

const ALL = "all";

export function GameList({ studentId, games }: { studentId: string; games: Game[] }) {
  const navigate = useNavigate();
  const [color, setColor] = useState<PieceColor | typeof ALL>(ALL);
  const [result, setResult] = useState<GameResult | typeof ALL>(ALL);
  const [timeClass, setTimeClass] = useState<TimeClass | typeof ALL>(ALL);

  const timeClasses = useMemo(
    () => [...new Set(games.map((g) => g.timeClass))],
    [games],
  );

  const filtered = useMemo(
    () =>
      games.filter(
        (g) =>
          (color === ALL || g.color === color) &&
          (result === ALL || g.result === result) &&
          (timeClass === ALL || g.timeClass === timeClass),
      ),
    [games, color, result, timeClass],
  );

  if (games.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay partidas en el último mes.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Select value={color} onValueChange={(v) => setColor(v as PieceColor | typeof ALL)}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo color</SelectItem>
            <SelectItem value="white">{COLOR_LABELS.white}</SelectItem>
            <SelectItem value="black">{COLOR_LABELS.black}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={result} onValueChange={(v) => setResult(v as GameResult | typeof ALL)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo resultado</SelectItem>
            <SelectItem value="win">{RESULT_LABELS.win}</SelectItem>
            <SelectItem value="draw">{RESULT_LABELS.draw}</SelectItem>
            <SelectItem value="loss">{RESULT_LABELS.loss}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeClass} onValueChange={(v) => setTimeClass(v as TimeClass | typeof ALL)}>
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo ritmo</SelectItem>
            {timeClasses.map((tc) => (
              <SelectItem key={tc} value={tc}>
                {TIME_CLASS_LABELS[tc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {filtered.length} de {games.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Rival</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="hidden sm:table-cell">Término</TableHead>
              <TableHead className="hidden sm:table-cell">Ritmo</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((g) => (
              <TableRow
                key={g.id}
                className="cursor-pointer"
                onClick={() => navigate(`/students/${studentId}/games/${g.id}`)}
              >
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(g.playedAt)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-block size-3 rounded-full border",
                      g.color === "white" ? "bg-white" : "bg-neutral-800",
                    )}
                    title={COLOR_LABELS[g.color]}
                  />
                </TableCell>
                <TableCell className="max-w-40 truncate">
                  {g.opponent}
                  {g.opponentRating != null && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({g.opponentRating})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-normal", RESULT_STYLES[g.result])}>
                    {RESULT_LABELS[g.result]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {TERMINATION_LABELS[g.termination]}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-sm">{TIME_CLASS_LABELS[g.timeClass]}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {SOURCE_LABELS[g.source]}
                  </span>
                </TableCell>
                <TableCell>
                  <IconExternalLink size={14} className="text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
