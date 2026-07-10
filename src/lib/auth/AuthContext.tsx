import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Teacher } from "@/types";
import { authRepository } from "@/lib/repositories";

interface AuthContextValue {
  teacher: Teacher | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(() =>
    authRepository.getCurrentTeacher(),
  );

  const login = useCallback(async (email: string, password: string) => {
    setTeacher(await authRepository.login(email, password));
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      setTeacher(await authRepository.register(input));
    },
    [],
  );

  const logout = useCallback(() => {
    authRepository.logout();
    setTeacher(null);
  }, []);

  const value = useMemo(
    () => ({ teacher, login, register, logout }),
    [teacher, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
