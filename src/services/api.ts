import { setAuth, clearAuth, type SessionUser } from "@/lib/auth"
import type {
  AuthResponse,
  Book,
  Copy,
  Editorial,
  Penalty,
  FormatoCopia,
  User,
  SocioUser,
  RegisterRequest,
} from "@/types/models"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const j = await res.json()
      msg = (j as { error?: string }).error ?? msg
    } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

export async function apiRegister(nombre: string, email: string, password: string): Promise<{ message: string }> {
  return await request<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nombre, email, password }),
  })
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const r = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setAuth(r.user as SessionUser)
  return r
}

export async function apiLogout(): Promise<void> {
  await request("/auth/logout", { method: "POST" })
  clearAuth()
}

export async function apiProfile(): Promise<User> {
  return await request<User>("/auth/profile", { method: "GET" })
}

export async function apiBooks(): Promise<Book[]> {
  return await request<Book[]>("/books", { method: "GET" })
}

export async function apiCreateBook(payload: {
  titulo: string
  descripcion: string | null
  idioma: string
  portada_url: string | null
  fecha_publicacion: string | null
  autores: { nombre: string }[]
  generos: { nombre: string }[]
}): Promise<{ message: string; id: string }> {
  return await request<{ message: string; id: string }>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function apiUpdateBook(
  id: string,
  payload: Partial<{
    titulo: string
    descripcion: string | null | undefined
    idioma: string | null | undefined
    portada_url: string | null | undefined
    fecha_publicacion: string | null | undefined
    autores: { nombre: string }[]
    generos: { nombre: string }[]
  }>,
): Promise<{ message: string }> {
  return await request<{ message: string }>(`/books/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function apiCopiesByBook(libroId: string): Promise<Copy[]> {
  return await request<Copy[]>(`/copies?libro_id=${encodeURIComponent(libroId)}`, { method: "GET" })
}

export async function apiCreateCopy(payload: {
  libro_id: string
  editorial_id: string
  isbn?: string | null
  edicion?: string | null
  formato: FormatoCopia
}): Promise<{ message: string; id: string }> {
  return await request<{ message: string; id: string }>("/copies", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function apiEditorials(): Promise<Editorial[]> {
  return await request<Editorial[]>("/editorials", { method: "GET" })
}

export async function apiPenaltiesAll(): Promise<Penalty[]> {
  return await request<Penalty[]>("/penalties", { method: "GET" })
}

export async function apiCreatePenalty(payload: {
  socio_id: string
  monto: number
  motivo: string
  prestamo_id?: string | null
  detalle?: string | null
}): Promise<{ id: string; message: string }> {
  return await request<{ id: string; message: string }>("/penalties", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function apiUpdatePenalty(
  id: string,
  payload: Partial<{
    monto: number
    motivo: string
    detalle: string | null
    estado: "PENDIENTE" | "PAGADA" | "ANULADA"
  }>,
): Promise<{ message: string }> {
  return await request<{ message: string }>(`/penalties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function apiDeletePenalty(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/penalties/${encodeURIComponent(id)}`, { method: "DELETE" })
}

export async function apiSocioByUser(userId: string): Promise<{ id: string; usuario_id: string; dni?: string }> {
  return await request<{ id: string; usuario_id: string; dni?: string }>(
    `/socios/by-user/${encodeURIComponent(userId)}`,
    { method: "GET" },
  )
}

export async function apiSociosAll(): Promise<SocioUser[]> {
  return await request<SocioUser[]>("/socios", { method: "GET" })
}

export async function apiRegisterRequests(): Promise<RegisterRequest[]> {
  return await request<RegisterRequest[]>("/solicitudes", { method: "GET" })
}

export async function apiApproveRequest(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/solicitudes/${encodeURIComponent(id)}/approve`, { method: "POST" })
}

export async function apiRejectRequest(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/solicitudes/${encodeURIComponent(id)}/reject`, { method: "POST" })
}

export async function apiDevSeed(): Promise<{ created: boolean }> {
  return await request<{ created: boolean }>("/dev/seed", { method: "POST" })
}
