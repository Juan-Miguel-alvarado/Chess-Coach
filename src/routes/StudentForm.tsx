import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { studentRepository, gameCacheRepository } from "@/lib/repositories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StudentForm() {
  const { teacher } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id ? studentRepository.get(id) : null;
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [age, setAge] = useState(
    existing?.age != null ? String(existing.age) : "",
  );
  const [chesscom, setChesscom] = useState(existing?.chesscomUsername ?? "");
  const [lichess, setLichess] = useState(existing?.lichessUsername ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!teacher) return;
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!chesscom.trim() && !lichess.trim()) {
      setError("Indica al menos un usuario de Chess.com o Lichess.");
      return;
    }
    const parsedAge = age.trim() ? Number(age) : null;
    if (parsedAge != null && (Number.isNaN(parsedAge) || parsedAge < 3 || parsedAge > 120)) {
      setError("Edad no válida.");
      return;
    }
    const payload = {
      teacherId: teacher.id,
      name: name.trim(),
      age: parsedAge,
      chesscomUsername: chesscom.trim() || undefined,
      lichessUsername: lichess.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit && existing) {
      const usersChanged =
        (existing.chesscomUsername ?? "") !== (chesscom.trim() || "") ||
        (existing.lichessUsername ?? "") !== (lichess.trim() || "");
      studentRepository.update(existing.id, payload);
      // Sólo invalida la caché de partidas si cambiaron los usuarios.
      if (usersChanged) gameCacheRepository.clear(existing.id);
      toast.success("Alumno actualizado");
      navigate(`/students/${existing.id}`);
    } else {
      const created = studentRepository.create(payload);
      toast.success("Alumno agregado");
      navigate(`/students/${created.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to={isEdit && existing ? `/students/${existing.id}` : "/students"}>
          <IconArrowLeft size={16} /> Volver
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar alumno" : "Nuevo alumno"}</CardTitle>
          <CardDescription>
            Sus partidas se cargan automáticamente desde Chess.com y Lichess.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                min={3}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Usuarios de plataforma
              </span>
              Basta con indicar <strong>uno</strong> de los dos. Lo ideal es poner
              ambos: así podrás ver y comparar sus estadísticas de Chess.com y de
              Lichess por separado.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="chesscom">Usuario de Chess.com</Label>
                <Input
                  id="chesscom"
                  placeholder="ej. magnuscarlsen"
                  value={chesscom}
                  onChange={(e) => setChesscom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lichess">Usuario de Lichess</Label>
                <Input
                  id="lichess"
                  placeholder="ej. DrNykterstein"
                  value={lichess}
                  onChange={(e) => setLichess(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notas del profesor</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Objetivos, aperturas a trabajar, observaciones…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="submit">
                <IconDeviceFloppy size={16} />
                {isEdit ? "Guardar cambios" : "Crear alumno"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
