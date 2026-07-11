// Limpieza única de los alumnos demo del test: elimina de localStorage los
// alumnos con id "demo-*" (y su caché de partidas). Se ejecuta una sola vez.
// Cuando ya no queden navegadores con datos demo, puede borrarse este archivo y
// su llamada en main.tsx.

const KEYS = {
  students: "chesscoach.students",
  gameCache: "chesscoach.gameCache",
  flag: "chesscoach.demoCleaned",
} as const;

export function cleanupDemoStudents(): void {
  if (localStorage.getItem(KEYS.flag)) return;
  try {
    const students = JSON.parse(
      localStorage.getItem(KEYS.students) ?? "[]",
    ) as { id: string }[];
    localStorage.setItem(
      KEYS.students,
      JSON.stringify(students.filter((s) => !String(s.id).startsWith("demo-"))),
    );

    const caches = JSON.parse(
      localStorage.getItem(KEYS.gameCache) ?? "[]",
    ) as { studentId: string }[];
    localStorage.setItem(
      KEYS.gameCache,
      JSON.stringify(
        caches.filter((c) => !String(c.studentId).startsWith("demo-")),
      ),
    );
  } catch {
    /* si algo falla, no bloquea el arranque */
  }
  localStorage.setItem(KEYS.flag, "1");
}
