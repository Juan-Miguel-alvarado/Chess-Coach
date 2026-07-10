# ChessCoach

Plataforma para profesores de ajedrez: registra a tus alumnos con su usuario de
**Chess.com** y **Lichess**, y la app descarga automáticamente sus partidas del
último mes desde las APIs públicas para mostrar estadísticas accionables y un
visor de partidas jugada a jugada.

## Problemática

Para seguir el progreso de sus alumnos, el profesor de ajedrez hoy tiene que
**abrir muchas páginas y revisar muchos perfiles en sitios distintos**: entrar a
Chess.com de cada alumno, luego a su Lichess, buscar sus partidas, mirar
estadísticas por separado, comparar a mano cómo van con blancas y negras, en qué
ritmos, cómo ganan o pierden… Es un proceso lento, disperso y difícil de repetir
para cada estudiante.

## Solución

**ChessCoach reúne todo en una sola aplicación.** El profesor da de alta al
alumno una vez (con su usuario de Chess.com y/o Lichess) y la plataforma:

- Descarga automáticamente sus partidas del último mes de **ambas plataformas**.
- Las unifica y calcula las **estadísticas** en un solo lugar: rendimiento con
  blancas y negras, por ritmo, formas de ganar y perder, aperturas y progresión
  de rating.
- Muestra un **dashboard** con todos los alumnos y alertas para saber a quién
  revisar primero.
- Permite **reproducir cada partida** jugada a jugada sin salir de la app.

Así, en lugar de abrir decenas de pestañas en varios sitios, el profesor tiene
**el panorama completo de cada alumno en una sola página**.

## Funcionalidades

- **Auth de profesor** (registro / login) — Fase 1 en `localStorage`.
- **Alumnos**: alta/edición con nombre, edad, usuario Chess.com, usuario Lichess y notas.
- **Dashboard**: tarjeta por alumno con balance V-T-D, forma reciente y alertas
  (racha de derrotas, caída de rating, inactividad). Búsqueda y "Sincronizar todos".
- **Perfil del alumno**:
  - Ratings actuales por ritmo (ambas fuentes).
  - KPIs, progresión de rating, rendimiento por color, por ritmo.
  - Cómo gana / cómo pierde (por forma de término) y aperturas más jugadas.
  - Lista de partidas con filtros (color / resultado / ritmo).
- **Visor de partidas**: tablero navegable jugada a jugada (teclas ← →), lista de
  jugadas, copiar/descargar PGN y enlace a la partida original.
- Tema claro/oscuro.

## Stack

Vite · React · TypeScript · Tailwind v4 · shadcn/ui · Tabler Icons · fuente Onest ·
Recharts · chess.js · react-chessboard · react-router.

## Arquitectura

El acceso a datos vive detrás de interfaces en [`src/lib/repositories`](src/lib/repositories/)
(`AuthRepository`, `StudentRepository`, `GameCacheRepository`). Hoy la
implementación es `localStorage`; **para migrar a Supabase basta con añadir una
implementación con la misma forma y cambiar las asignaciones en
[`src/lib/repositories/index.ts`](src/lib/repositories/index.ts)** — la UI no cambia.

Las partidas de Chess.com y Lichess se normalizan a un tipo `Game` único en
[`src/lib/api`](src/lib/api/), y las estadísticas se derivan en
[`src/lib/stats/deriveStats.ts`](src/lib/stats/deriveStats.ts).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
```

Crea una cuenta, agrega un alumno con un usuario real (p. ej. Chess.com
`magnuscarlsen`) y pulsa Sincronizar.
