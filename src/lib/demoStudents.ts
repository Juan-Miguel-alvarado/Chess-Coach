// Alumnos de prueba con cuentas REALES verificadas (solo para testear).
// Se agregan manualmente desde el botón "Agregar 20 alumnos (test)".

import { studentRepository } from "@/lib/repositories";

// [nombre, chess.com, lichess, edad]
const DEMO: [string, string | null, string | null, number][] = [
  ["Magnus Carlsen", "MagnusCarlsen", "DrNykterstein", 34],
  ["Hikaru Nakamura", "Hikaru", null, 37],
  ["Fabiano Caruana", "FabianoCaruana", null, 32],
  ["Ian Nepomniachtchi", "LachesisQ", null, 34],
  ["Alireza Firouzja", "Firouzja2003", "alireza2003", 21],
  ["Levy Rozman", "GothamChess", null, 29],
  ["Nihal Sarin", "nihalsarin", null, 20],
  ["Levon Aronian", "LevonAronian", null, 42],
  ["Jan-Krzysztof Duda", "Polish_fighter3000", null, 26],
  ["Nodirbek Abdusattorov", "ChessWarrior7197", null, 20],
  ["Wesley So", "GMWSO", null, 31],
  ["Anna Cramling", "AnnaCramling", null, 23],
  ["Eric Rosen", "IMRosen", "EricRosen", 32],
  ["Andrew Tang", "penguingm1", "penguingm1", 25],
  ["Gukesh D", "GukeshDommaraju", null, 18],
  ["R Praggnanandhaa", "RPragChess", null, 19],
  ["Ding Liren", "DingLiren", null, 32],
  ["Eric Hansen", "chessbrah", null, 33],
  ["Sergei Zhigalko", null, "Zhigalko_Sergei", 36],
  ["Jerry (ChessNetwork)", null, "Chess-Network", 40],
];

// Agrega los alumnos demo al profesor, evitando duplicados por usuario. Devuelve
// cuántos se agregaron.
export function addDemoStudents(teacherId: string): number {
  const existing = studentRepository.list(teacherId);
  const taken = new Set(
    existing.flatMap((s) =>
      [s.chesscomUsername, s.lichessUsername]
        .filter(Boolean)
        .map((u) => (u as string).toLowerCase()),
    ),
  );

  let added = 0;
  for (const [name, cc, li, age] of DEMO) {
    const key = (cc ?? li ?? "").toLowerCase();
    if (key && taken.has(key)) continue;
    studentRepository.create({
      teacherId,
      name,
      age,
      chesscomUsername: cc ?? undefined,
      lichessUsername: li ?? undefined,
    });
    added += 1;
  }
  return added;
}
