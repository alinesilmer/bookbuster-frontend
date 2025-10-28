import { setAuth, clearAuth, type SessionUser } from "@/lib/auth";
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
  Loan,
} from "@/types/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function compact<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (typeof (j as any)?.error === "string") msg = (j as any).error;
      else if (Array.isArray((j as any)?.errors) && (j as any).errors[0]?.msg) msg = (j as any).errors[0].msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

/* Auth */
export async function apiRegister(
  nombre: string,
  email: string,
  password: string
): Promise<{ message: string }> {
  return await request<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nombre, email, password }),
  });
}

export async function apiLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  const r = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuth(r.user as SessionUser);
  return r;
}

export async function apiLogout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
  clearAuth();
}

export async function apiProfile(): Promise<User> {
  return await request<User>("/auth/profile", { method: "GET" });
}

/* Books */
export async function apiBooks(): Promise<Book[]> {
  return await request<Book[]>("/books", { method: "GET" });
}

export async function apiBookById(id: string): Promise<Book> {
  return await request<Book>(`/books/${encodeURIComponent(id)}`, { method: "GET" });
}

export async function apiCreateBook(payload: {
  titulo: string;
  descripcion: string | null;
  idioma: string;
  portada_url: string | null;
  fecha_publicacion: string | null;
  autores: { nombre: string }[];
  generos: { nombre: string }[];
}): Promise<{ message: string; id: string }> {
  return await request<{ message: string; id: string }>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateBook(
  id: string,
  payload: Partial<{
    titulo: string;
    descripcion: string | null | undefined;
    idioma: string | null | undefined;
    portada_url: string | null | undefined;
    fecha_publicacion: string | null | undefined;
    autores: { nombre: string }[];
    generos: { nombre: string }[];
  }>
): Promise<{ message: string }> {
  const body = compact(payload);
  return await request<{ message: string }>(`/books/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/* Editorials */
export async function apiEditorials(): Promise<Editorial[]> {
  return await request<Editorial[]>("/editoriales", { method: "GET" });
}

export async function apiCreateEditorial(nombre: string): Promise<{ message: string; id: string }> {
  return await request<{ message: string; id: string }>("/editoriales", {
    method: "POST",
    body: JSON.stringify({ nombre }),
  });
}

/* Copies */
export async function apiCopiesByBook(libroId: string): Promise<Copy[]> {
  return await request<Copy[]>(`/copies?libro_id=${encodeURIComponent(libroId)}`, { method: "GET" });
}

export async function apiCreateCopy(payload: {
  libro_id: string;
  editorial_id: string;
  isbn?: string | null;
  edicion?: string | null;
  formato: FormatoCopia;
}): Promise<{ message: string; id: string }> {
  return await request<{ message: string; id: string }>("/copies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateCopy(
  id: string,
  payload: Partial<{
    libro_id: string;
    editorial_id: string;
    isbn: string | null;
    edicion: string | null;
    formato: FormatoCopia;
    estado: "DISPONIBLE" | "PRESTADO";
  }>
): Promise<{ message: string }> {
  return await request<{ message: string }>(`/copies/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteCopy(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/copies/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* Loans */
export async function apiCreateLoan(
  copiaId: string,
  fechaVenc?: string,
  socioId?: string
): Promise<{ id: string; fecha_vencimiento: string; socio_id: string }> {
  return await request<{ id: string; fecha_vencimiento: string; socio_id: string }>("/loans", {
    method: "POST",
    body: JSON.stringify({
      copia_id: copiaId,
      fecha_vencimiento: fechaVenc,
      socio_id: socioId,
    }),
  });
}
export async function apiLoansBySocio(
  socioId: string,
  estado?: "ACTIVO" | "DEVUELTO" | "VENCIDO" | "CANCELADO"
): Promise<Array<{ id: string; copia_id: string; fecha_inicio: string; fecha_vencimiento: string; estado: string; bookTitle?: string }>> {
  const qs = new URLSearchParams();
  qs.set("socio_id", socioId);
  if (estado) qs.set("estado", estado);
  return await request(`/loans?${qs.toString()}`, { method: "GET" });
}

export async function apiReturnLoan(
  loanId: string,
  opts?: { createPenalty?: boolean; penalty?: { motivo: string; monto: number; detalle?: string | null } }
): Promise<{ message: string }> {
  return await request<{ message: string }>(`/loans/${encodeURIComponent(loanId)}/return`, {
    method: "PATCH",
    body: JSON.stringify(opts ?? {}),
  });
}

export async function apiLoansMine(): Promise<Loan[]> {
  return await request<Loan[]>("/loans/mine", { method: "GET" });
}

/* Penalties */

export type BackendPenaltyType = "DEVOLUCION_TARDIA" | "LIBRO_DANIADO" | "LIBRO_PERDIDO";

export async function apiPenaltiesAll(): Promise<Penalty[]> {
  return await request<Penalty[]>("/penalties", { method: "GET" });
}

export async function apiCreatePenalty(payload: {
  socio_id: string;
  tipo: BackendPenaltyType;
  detalle?: string | null;
  prestamo_id?: string;
}): Promise<{ id: string; message: string }> {
  const body: any = {
    socio_id: payload.socio_id,
    tipo: payload.tipo,
  };
  if (payload.detalle !== undefined) body.detalle = payload.detalle;
  if (payload.prestamo_id) body.prestamo_id = payload.prestamo_id;

  return await request<{ id: string; message: string }>("/penalties", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdatePenalty(
  id: string,
  payload: Partial<{
    detalle: string | null;
    estado: "PENDIENTE" | "PAGADA" | "ANULADA";
  }>
): Promise<{ message: string }> {
  return await request<{ message: string }>(`/penalties/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiDeletePenalty(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/penalties/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* Socios */
export async function apiSocioByUser(userId: string): Promise<{ id: string; usuario_id: string; dni?: string }> {
  return await request<{ id: string; usuario_id: string; dni?: string }>(`/socios/by-user/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}

export async function apiSociosAll(): Promise<SocioUser[]> {
  return await request<SocioUser[]>("/socios", { method: "GET" });
}

/* Solicitudes */
export async function apiRegisterRequests(): Promise<RegisterRequest[]> {
  return await request<RegisterRequest[]>("/solicitudes", { method: "GET" });
}

export async function apiApproveRequest(id: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/solicitudes/${encodeURIComponent(id)}/approve`, { method: "POST" });
}

export async function apiRejectRequest(id: string, motivo: string): Promise<{ message: string }> {
  return await request<{ message: string }>(`/solicitudes/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export async function apiCreateRegisterRequest(payload: { nombre: string; email: string; telefono?: string | null }) {
  return await request<{ id: string; message: string }>("/solicitudes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* Dev */
export async function apiDevSeed(): Promise<{ created: boolean }> {
  return await request<{ created: boolean }>("/dev/seed", { method: "POST" });
}
