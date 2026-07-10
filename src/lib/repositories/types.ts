import type { GameCache, Student, Teacher } from "@/types";

// Interfaces de acceso a datos. La UI depende SOLO de estas interfaces.
// Fase 1: implementación localStorage. Fase 2: implementación Supabase con la
// misma forma, sin tocar la UI.

export interface AuthRepository {
  register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<Teacher>;
  login(email: string, password: string): Promise<Teacher>;
  logout(): void;
  getCurrentTeacher(): Teacher | null;
}

export interface StudentRepository {
  list(teacherId: string): Student[];
  get(id: string): Student | null;
  create(
    input: Omit<Student, "id" | "createdAt">,
  ): Student;
  update(id: string, patch: Partial<Omit<Student, "id" | "teacherId" | "createdAt">>): Student;
  remove(id: string): void;
}

export interface GameCacheRepository {
  get(studentId: string): GameCache | null;
  set(cache: GameCache): void;
  clear(studentId: string): void;
}
