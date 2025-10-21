export type SessionUser = {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "BIBLIOTECARIO" | "SOCIO";
};

const KEY = "bb_session_user";

export function setAuth(user: SessionUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function isLoggedIn(): boolean {
  return !!getUser();
}
