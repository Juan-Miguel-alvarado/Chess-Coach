import type { GameCache, Student, Teacher } from "@/types";
import { hashPassword, newId } from "@/lib/id";
import type {
  AuthRepository,
  GameCacheRepository,
  StudentRepository,
} from "./types";

const KEYS = {
  teachers: "chesscoach.teachers",
  session: "chesscoach.session",
  students: "chesscoach.students",
  gameCache: "chesscoach.gameCache",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Auth ----------

export const localAuthRepository: AuthRepository = {
  async register({ name, email, password }) {
    const teachers = read<Teacher[]>(KEYS.teachers, []);
    const normalizedEmail = email.trim().toLowerCase();
    if (teachers.some((t) => t.email === normalizedEmail)) {
      throw new Error("Ya existe una cuenta con ese correo.");
    }
    const teacher: Teacher = {
      id: newId(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      createdAt: Date.now(),
    };
    write(KEYS.teachers, [...teachers, teacher]);
    write(KEYS.session, teacher.id);
    return teacher;
  },

  async login(email, password) {
    const teachers = read<Teacher[]>(KEYS.teachers, []);
    const normalizedEmail = email.trim().toLowerCase();
    const hash = await hashPassword(password);
    const teacher = teachers.find(
      (t) => t.email === normalizedEmail && t.passwordHash === hash,
    );
    if (!teacher) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    write(KEYS.session, teacher.id);
    return teacher;
  },

  logout() {
    localStorage.removeItem(KEYS.session);
  },

  getCurrentTeacher() {
    const sessionId = read<string | null>(KEYS.session, null);
    if (!sessionId) return null;
    const teachers = read<Teacher[]>(KEYS.teachers, []);
    return teachers.find((t) => t.id === sessionId) ?? null;
  },
};

// ---------- Students ----------

export const localStudentRepository: StudentRepository = {
  list(teacherId) {
    return read<Student[]>(KEYS.students, [])
      .filter((s) => s.teacherId === teacherId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  get(id) {
    return read<Student[]>(KEYS.students, []).find((s) => s.id === id) ?? null;
  },

  create(input) {
    const students = read<Student[]>(KEYS.students, []);
    const student: Student = { ...input, id: newId(), createdAt: Date.now() };
    write(KEYS.students, [...students, student]);
    return student;
  },

  update(id, patch) {
    const students = read<Student[]>(KEYS.students, []);
    const idx = students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Alumno no encontrado.");
    const updated = { ...students[idx], ...patch };
    students[idx] = updated;
    write(KEYS.students, students);
    return updated;
  },

  remove(id) {
    const students = read<Student[]>(KEYS.students, []);
    write(
      KEYS.students,
      students.filter((s) => s.id !== id),
    );
    // limpiar caché de partidas asociada
    const caches = read<GameCache[]>(KEYS.gameCache, []);
    write(
      KEYS.gameCache,
      caches.filter((c) => c.studentId !== id),
    );
  },
};

// ---------- Game cache ----------

export const localGameCacheRepository: GameCacheRepository = {
  get(studentId) {
    return (
      read<GameCache[]>(KEYS.gameCache, []).find(
        (c) => c.studentId === studentId,
      ) ?? null
    );
  },

  set(cache) {
    const caches = read<GameCache[]>(KEYS.gameCache, []);
    const idx = caches.findIndex((c) => c.studentId === cache.studentId);
    if (idx === -1) caches.push(cache);
    else caches[idx] = cache;
    write(KEYS.gameCache, caches);
  },

  clear(studentId) {
    const caches = read<GameCache[]>(KEYS.gameCache, []);
    write(
      KEYS.gameCache,
      caches.filter((c) => c.studentId !== studentId),
    );
  },
};
