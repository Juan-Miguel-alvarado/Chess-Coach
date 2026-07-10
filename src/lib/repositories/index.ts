// Punto único de acceso a los repositorios. Para migrar a Supabase, basta con
// cambiar estas asignaciones por las implementaciones supabase.* — la UI no cambia.

import {
  localAuthRepository,
  localGameCacheRepository,
  localStudentRepository,
} from "./localStorage";
import type {
  AuthRepository,
  GameCacheRepository,
  StudentRepository,
} from "./types";

export const authRepository: AuthRepository = localAuthRepository;
export const studentRepository: StudentRepository = localStudentRepository;
export const gameCacheRepository: GameCacheRepository =
  localGameCacheRepository;

export type { AuthRepository, GameCacheRepository, StudentRepository };
