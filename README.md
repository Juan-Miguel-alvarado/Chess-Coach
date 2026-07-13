# ChessCoach

A platform for chess teachers: register your students with their **Chess.com**
and **Lichess** usernames, and the app automatically downloads their games from
the last month via the public APIs to show actionable statistics and a
move-by-move game viewer.

<img width="1302" height="677" alt="image" src="https://github.com/user-attachments/assets/17325dfe-3d66-4a02-abbf-a2e76e9a314e" />

## Problem

To keep track of their students' progress, a chess teacher today has to **open
many pages and review many profiles across different sites**: go to each
student's Chess.com, then their Lichess, look up their games, review statistics
separately, manually compare how they do with white and black, at which time
controls, how they win or lose… It's a slow, scattered process that's hard to
repeat for every student.

## Solution

**ChessCoach brings everything together in a single application.** The teacher
registers the student once (with their Chess.com and/or Lichess username) and the
platform:

- Automatically downloads their games from the last month on **both platforms**.
- Unifies them and computes the **statistics** in one place: performance with
  white and black, by time control, ways of winning and losing, openings and
  rating progression.
- Shows a **dashboard** with all students and alerts so you know who to review
  first.
- Lets you **replay each game** move by move without leaving the app.

So instead of opening dozens of tabs across several sites, the teacher has **the
complete picture of each student on a single page**.

## Features

- **Teacher auth** (sign up / log in) — Phase 1 in `localStorage`.
- **Students**: create/edit with name, age, Chess.com username, Lichess username and notes.
- **Dashboard**: a card per student with W-D-L balance, recent form and alerts
  (losing streak, rating drop, inactivity). Search and "Sync all".
- **Student profile**:
  - Current ratings by time control (both sources).
  - KPIs, rating progression, performance by color, by time control.
  - How they win / how they lose (by termination type) and most played openings.
  - Game list with filters (color / result / time control).
- **Game viewer**: navigable board move by move (← → keys), move list,
  copy/download PGN and a link to the original game.
- Light/dark theme.

## Stack

Vite · React · TypeScript · Tailwind v4 · shadcn/ui · Tabler Icons · Onest font ·
Recharts · chess.js · react-chessboard · react-router.

## Architecture

Data access lives behind interfaces in [`src/lib/repositories`](src/lib/repositories/)
(`AuthRepository`, `StudentRepository`, `GameCacheRepository`). Today the
implementation is `localStorage`; **to migrate to Supabase you just add an
implementation with the same shape and change the assignments in
[`src/lib/repositories/index.ts`](src/lib/repositories/index.ts)** — the UI
doesn't change.

Chess.com and Lichess games are normalized to a single `Game` type in
[`src/lib/api`](src/lib/api/), and the statistics are derived in
[`src/lib/stats/deriveStats.ts`](src/lib/stats/deriveStats.ts).

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
```

Create an account, add a student with a real username (e.g. Chess.com
`magnuscarlsen`) and click Sync.
