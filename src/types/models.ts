import { Timestamp } from "next/dist/server/lib/cache-handlers/types"

export type Role = "ADMIN" | "BIBLIOTECARIO" | "SOCIO"
export type EstadoSolicitud = "PENDIENTE" | "APROBADA" | "RECHAZADA"
export type EstadoCopia = "DISPONIBLE" | "PRESTADO"
export type FormatoCopia = "PDF" | "EPUB" | "AUDIOBOOK" | "FISICO"
export type EstadoPrestamo = "ACTIVO" | "DEVUELTO" | "VENCIDO" | "CANCELADO"
export type EstadoMulta = "PENDIENTE" | "PAGADA" | "ANULADA"

export type User = {
  id: string
  email: string
  nombre: string
  rol: Role
  activo?: boolean
  creado_en?: string
  nro_socio?: number | null
}

export type AuthResponse = {
  message: string
  user: User
}

export type Autor = { id: string; nombre: string }
export type Genero = { id: string; nombre: string }
export type Editorial = { id: string; nombre: string }

export type Book = {
  id: string
  titulo: string
  descripcion?: string | null
  idioma?: string | null
  portada_url?: string | null
  fecha_publicacion?: string | null
  autores: Autor[]
  generos: Genero[]
}

export type Copy = {
  id: string
  libro_id: string
  editorial_id: string
  isbn?: string | null
  edicion?: string | null
  formato: FormatoCopia
  estado: EstadoCopia
}

export type Penalty = {
  id: string
  socio_id: string
  prestamo_id: string
  monto: number
  motivo: string
  detalle?: string | null
  fecha: string
  estado: EstadoMulta
  socio?: { id: string; dni?: string; nombre?: string | null }
}

export type Loan = {
  id: string
  loanDate: string
  dueDate: string
  status: "active" | "late" | "returned"
  penalty?: number
}

export type UIBook = {
  id: string
  title: string
  author: string
  cover: string | null
  availableCopies: number
  totalCopies: number
  genre: string
  description?: string | null
}

export type SocioUser = {
  id: string
  usuario_id: string
  dni?: string
  nombre: string
  email: string
  activo: boolean
  prestamos_activos: number
  multas_pendientes: number
  nro_socio: number | null
}

export type RegisterRequest = {
  id: string
  nombre: string
  email: string
  telefono?: string | null
  fecha: string
  estado: EstadoSolicitud
}

export type Notificaciones ={
  notificacion_id: number;
  destinatario_usuario_id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  creada_en: Timestamp;
}

//ANOTACIONES Y CAMBIOS RESPECTO A DER
//el campo dni para socios no se consideró necesario, en tanto se tiene nr de socio, por lo cual pasó a ser un campo opcional
//lo mismo sucede, por consiguiente, en la solicitud de registro, donde no se requiere dni, y también se quitó observación
//url_archivo de copia también se descartó, pues era para replicar la posibilidad de una biblioteca virtual