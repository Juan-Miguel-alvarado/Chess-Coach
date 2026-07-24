import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCopy,
  IconDownload,
  IconExternalLink,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { Game } from "@/types";
import { studentRepository, gameCacheRepository } from "@/lib/repositories";
import {
  COLOR_LABELS,
  RESULT_LABELS,
  SOURCE_LABELS,
  TERMINATION_LABELS,
  TIME_CLASS_LABELS,
  formatDateTime,
} from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface ParsedGame {
  fens: string[]; // fens[0] = inicial, fens[i] = tras la jugada i
  sans: string[];
}

function parseGame(pgn: string): ParsedGame {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const moves = chess.history({ verbose: true });
    const fens = [moves[0]?.before ?? START_FEN, ...moves.map((m) => m.after)];
    return { fens, sans: moves.map((m) => m.san) };
  } catch {
    return { fens: [START_FEN], sans: [] };
  }
}

export function GameViewer() {
  const { id, gameId } = useParams();
  const student = id ? studentRepository.get(id) : null;

  const game = useMemo<Game | null>(() => {
    if (!id || !gameId) return null;
    const cache = gameCacheRepository.get(id);
    return cache?.games.find((g) => g.id === gameId) ?? null;
  }, [id, gameId]);

  const parsed = useMemo(() => parseGame(game?.pgn ?? ""), [game?.pgn]);
  const [ply, setPly] = useState(0);

  useEffect(() => {
    // Salta al final al abrir una partida.
    setPly(parsed.fens.length - 1);
  }, [parsed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setPly((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight")
        setPly((p) => Math.min(parsed.fens.length - 1, p + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [parsed.fens.length]);

  if (!game || !student) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-muted-foreground">
          Partida no encontrada. Vuelve a sincronizar al alumno.
        </p>
        <Button asChild variant="outline">
          <Link to={id ? `/students/${id}` : "/dashboard"}>Volver</Link>
        </Button>
      </div>
    );
  }

  const maxPly = parsed.fens.length - 1;

  async function copyPgn() {
    if (!game) return;
    await navigator.clipboard.writeText(game.pgn);
    toast.success("PGN copiado");
  }

  function downloadPgn() {
    if (!game) return;
    const blob = new Blob([game.pgn], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student?.name ?? "partida"}-${game.id}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to={`/students/${student.id}`}>
          <IconArrowLeft size={16} /> {student.name}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-full max-w-[560px]">
            <Chessboard
              options={{
                position: parsed.fens[ply] ?? START_FEN,
                boardOrientation: game.color,
                allowDragging: false,
                id: "viewer",
                darkSquareStyle: { backgroundColor: "#8d7345" },
                lightSquareStyle: { backgroundColor: "#ece1d4" },
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setPly(0)} disabled={ply === 0}>
              <IconChevronsLeft size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPly((p) => Math.max(0, p - 1))}
              disabled={ply === 0}
            >
              <IconChevronLeft size={18} />
            </Button>
            <span className="min-w-24 text-center text-sm text-muted-foreground tabular-nums">
              {ply} / {maxPly}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPly((p) => Math.min(maxPly, p + 1))}
              disabled={ply === maxPly}
            >
              <IconChevronRight size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPly(maxPly)}
              disabled={ply === maxPly}
            >
              <IconChevronsRight size={18} />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={copyPgn}>
              <IconCopy size={15} /> Copiar PGN
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPgn}>
              <IconDownload size={15} /> Descargar PGN
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={game.url} target="_blank" rel="noreferrer">
                <IconExternalLink size={15} /> Ver en {SOURCE_LABELS[game.source]}
              </a>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{COLOR_LABELS[game.color]}</Badge>
                <Badge variant="secondary">{RESULT_LABELS[game.result]}</Badge>
                <Badge variant="secondary">{TIME_CLASS_LABELS[game.timeClass]}</Badge>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Rival</dt>
                <dd className="text-right">
                  {game.opponent}
                  {game.opponentRating != null && ` (${game.opponentRating})`}
                </dd>
                <dt className="text-muted-foreground">Término</dt>
                <dd className="text-right">{TERMINATION_LABELS[game.termination]}</dd>
                <dt className="text-muted-foreground">Control</dt>
                <dd className="text-right">{game.timeControl}</dd>
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="text-right">{formatDateTime(game.playedAt)}</dd>
                {game.opening && (
                  <>
                    <dt className="text-muted-foreground">Apertura</dt>
                    <dd className="text-right">{game.opening}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <MoveList sans={parsed.sans} ply={ply} onSelect={setPly} />
        </div>
      </div>
    </div>
  );
}

function MoveList({
  sans,
  ply,
  onSelect,
}: {
  sans: string[];
  ply: number;
  onSelect: (ply: number) => void;
}) {
  if (sans.length === 0) {
    return (
      <Card>
        <CardContent className="py-4 text-sm text-muted-foreground">
          Esta partida no incluye jugadas (PGN no disponible).
        </CardContent>
      </Card>
    );
  }
  const rows: { num: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }

  return (
    <Card>
      <CardContent className="max-h-96 overflow-y-auto py-3">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-0.5 text-sm">
          {rows.map((r, ri) => (
            <div key={ri} className="contents">
              <span className="py-1 text-right text-muted-foreground tabular-nums">
                {r.num}.
              </span>
              <MoveCell san={r.white} active={ply === ri * 2 + 1} onClick={() => onSelect(ri * 2 + 1)} />
              <MoveCell
                san={r.black}
                active={ply === ri * 2 + 2}
                onClick={() => r.black && onSelect(ri * 2 + 2)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MoveCell({
  san,
  active,
  onClick,
}: {
  san?: string;
  active: boolean;
  onClick: () => void;
}) {
  if (!san) return <span />;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-1.5 py-1 text-left font-medium tabular-nums hover:bg-accent",
        active && "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      {san}
    </button>
  );
}
