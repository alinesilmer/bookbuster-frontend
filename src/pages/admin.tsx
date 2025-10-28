"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiUsers, FiBook, FiUserCheck, FiAlertCircle, FiDollarSign } from "react-icons/fi";
import Layout from "@/components/Layout/Layout";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import Toast from "@/components/Toast/Toast";
import styles from "@/styles/Admin.module.scss";
import UsuariosDashboard, { AdminUser } from "@/components/Admin/UsuariosDashboard";
import LibrosDashboard from "@/components/Admin/LibrosDashboard";
import SolicitudesDashboard from "@/components/Admin/SolicitudesDashboard";
import MultasDashboard from "@/components/Admin/MultasDashboard";
import {
  apiBooks,
  apiCopiesByBook,
  apiPenaltiesAll,
  apiCreatePenalty,
  apiUpdatePenalty,
  apiDeletePenalty,
  apiDevSeed,
  apiSocioByUser,
  apiSociosAll,
  apiRegisterRequests,
  apiApproveRequest,
  apiRejectRequest,
  type BackendPenaltyType,
} from "@/services/api";
import type { Book, Penalty, RegisterRequest, User } from "@/types/models";
import { getUser } from "@/lib/auth";

type ToastState = { id: string; message: string; type: "success" | "error" };

type AdminBookLocal = {
  id: string;
  title: string;
  author: string;
  totalCopies: number;
  availableCopies: number;
  loanedCopies: number;
};

const tUserStatus = (s: string) => (s === "active" ? "Activo" : s === "suspended" ? "Suspendido" : s);
const tPenaltyStatus = (estado: string) =>
  estado === "PAGADA" ? "Pagada" : estado === "PENDIENTE" ? "Pendiente" : estado === "ANULADA" ? "Anulada" : estado;
const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
};

/**
 * Map de opciones visibles en UI -> clave real del backend (MULTA_TIPO)
 * Ojo con la tilde: backend usa "LIBRO_DANIADO".
 */
const PENALTY_TYPES = {
  DEV_TARDIA: { label: "Devolución tardía", backend: "DEVOLUCION_TARDIA" as BackendPenaltyType, monto: 500, motivoSugerido: "Devolución con atraso" },
  LIBRO_DANADO: { label: "Libro dañado", backend: "LIBRO_DANIADO" as BackendPenaltyType, monto: 3000, motivoSugerido: "Libro dañado" },
  LIBRO_PERDIDO: { label: "Libro perdido", backend: "LIBRO_PERDIDO" as BackendPenaltyType, monto: 15000, motivoSugerido: "Libro perdido" },
} as const;

type PenaltyTypeKey = keyof typeof PENALTY_TYPES;

export default function Admin() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"users" | "books" | "requests" | "penalties">("users");
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [penaltyType, setPenaltyType] = useState<PenaltyTypeKey>("DEV_TARDIA");
  const [penaltyAmount, setPenaltyAmount] = useState("");   // solo display, backend no lo usa
  const [penaltyDetail, setPenaltyDetail] = useState("");   // se envía como "detalle" opcional

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [books, setBooks] = useState<AdminBookLocal[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [requests, setRequests] = useState<RegisterRequest[]>([]);

  const totalLoans = useMemo(() => books.reduce((sum, b) => sum + b.loanedCopies, 0), [books]);

  const showToast = (message: string, type: "success" | "error") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
    const u = getUser() as User | null;
    if (!u) {
      router.replace("/login?next=/admin");
      return;
    }
    if (u.rol !== "ADMIN") {
      router.replace("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    const seedKey = "bb_seed_done_v1";
    const run = async () => {
      try {
        if (typeof window !== "undefined" && localStorage.getItem(seedKey)) return;
        const r = await apiDevSeed();
        if (r.created && typeof window !== "undefined") localStorage.setItem(seedKey, "1");
      } catch {}
    };
    run();
  }, []);

  const reloadUsers = async () => {
    const listSocios = await apiSociosAll();
    const mapped: AdminUser[] = listSocios.map((s) => ({
      id: s.id,
      usuarioId: s.usuario_id,
      name: s.nombre,
      email: s.email,
      activeLoans: s.prestamos_activos ?? 0,
      penalties: s.multas_pendientes ?? 0,
      status: s.activo ? "active" : "suspended",
      nro_socio: s.nro_socio ?? null,
    }));
    const uniq = new Map<string, AdminUser>();
    mapped.forEach((u) => {
      const key = u.usuarioId || u.email || u.id;
      if (!uniq.has(key)) uniq.set(key, u);
    });
    setUsers(Array.from(uniq.values()));
  };

  const reloadBooksStats = async () => {
    const list = await apiBooks();
    const mappedBooks: AdminBookLocal[] = await Promise.all(
      list.map(async (b: Book) => {
        const copies = await apiCopiesByBook(b.id);
        const total = copies.length;
        const available = copies.filter((c) => c.estado === "DISPONIBLE").length;
        const loaned = total - available;
        const author = b.autores.length > 0 ? b.autores[0].nombre : "Varios";
        return { id: b.id, title: b.titulo, author, totalCopies: total, availableCopies: available, loanedCopies: loaned };
      })
    );
    setBooks(mappedBooks);
  };

  useEffect(() => {
    const load = async () => {
      try { await reloadBooksStats(); } catch {}
      try { await reloadUsers(); } catch (e) {
        showToast(e instanceof Error ? e.message : "Error cargando usuarios", "error");
      }
      try {
        const pen = await apiPenaltiesAll();
        setPenalties(pen);
      } catch {}
      try {
        const reqs = await apiRegisterRequests();
        setRequests(reqs);
      } catch {}
    };
    load();
    const onBooksUpdated = () => reloadBooksStats();
    window.addEventListener("books:updated", onBooksUpdated as EventListener);
    return () => window.removeEventListener("books:updated", onBooksUpdated as EventListener);
  }, []);

  const onSaveUser = async (id: string, payload: { nombre: string; email: string }) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, name: payload.nombre, email: payload.email } : u)));
    showToast("Usuario actualizado", "success");
  };

  const suspendUser = async () => {
    showToast("Acción no disponible", "error");
  };

  const openPenaltyModal = (u: AdminUser) => {
    setSelectedUser(u);
    const k: PenaltyTypeKey = "DEV_TARDIA";
    setPenaltyType(k);
    setPenaltyAmount(String(PENALTY_TYPES[k].monto));    // display-only
    setPenaltyDetail("");                                // opcional
    setIsPenaltyModalOpen(true);
  };

  const submitPenalty = async () => {
    try {
      if (!selectedUser) return;

      const socio = await apiSocioByUser(selectedUser.usuarioId);

      // Enviamos el tipo REAL del backend y detalle opcional. NO enviamos monto/motivo.
      await apiCreatePenalty({
        socio_id: socio.id,
        tipo: PENALTY_TYPES[penaltyType].backend,
        detalle: penaltyDetail?.trim() ? penaltyDetail.trim() : undefined,
      });

      const pen = await apiPenaltiesAll();
      setPenalties(pen);
      await reloadUsers();
      showToast("Multa creada", "success");
      setIsPenaltyModalOpen(false);
      setActiveTab("penalties");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  const markPenaltyPaid = async (p: Penalty) => {
    try {
      await apiUpdatePenalty(p.id, { estado: "PAGADA" });
    } catch {}
    setPenalties((list) => list.map((x) => (x.id === p.id ? { ...x, estado: "PAGADA" } : x)));
    showToast("Multa marcada como pagada", "success");
  };

  const deletePenalty = async (p: Penalty) => {
    try {
      await apiDeletePenalty(p.id);
      setPenalties((list) => list.filter((x) => x.id !== p.id));
      showToast("Multa eliminada", "success");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  const approveRequest = async (req: RegisterRequest) => {
    try {
      await apiApproveRequest(req.id);
      setRequests((prev) => prev.filter((x) => x.id !== req.id));
      await reloadUsers();
      showToast("Solicitud aprobada", "success");
      setActiveTab("users");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  return (
    <Layout>
      <div className={styles.admin}>
        <div className="container">
          <h1 className="page-title">Panel de Administración</h1>

          <div className={styles.stats}>
            <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <FiUsers />
              </div>
              <div className={styles.statContent}>
                <h3>Total de usuarios</h3>
                <p className={styles.statValue}>{users.length}</p>
              </div>
            </motion.div>

            <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                <FiBook />
              </div>
              <div className={styles.statContent}>
                <h3>Total de libros</h3>
                <p className={styles.statValue}>{books.length}</p>
              </div>
            </motion.div>

            <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                <FiUserCheck />
              </div>
              <div className={styles.statContent}>
                <h3>Solicitudes pendientes</h3>
                <p className={styles.statValue}>{requests.length}</p>
              </div>
            </motion.div>

           
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === "users" ? styles.active : ""}`} onClick={() => setActiveTab("users")}><FiUsers /> Usuarios</button>
            <button className={`${styles.tab} ${activeTab === "books" ? styles.active : ""}`} onClick={() => setActiveTab("books")}><FiBook /> Libros</button>
            <button className={`${styles.tab} ${activeTab === "requests" ? styles.active : ""}`} onClick={() => setActiveTab("requests")}><FiUserCheck /> Solicitudes de registro</button>
            <button className={`${styles.tab} ${activeTab === "penalties" ? styles.active : ""}`} onClick={() => setActiveTab("penalties")}><FiDollarSign /> Multas</button>
          </div>

          <div className={styles.content}>
            {activeTab === "users" && (
              <UsuariosDashboard
                users={users}
                tUserStatus={tUserStatus}
                openEditUser={(u) => setSelectedUser(u)}
                openPenalty={openPenaltyModal}
                suspendUser={suspendUser}
                onSaveUser={onSaveUser}
              />
            )}

            {activeTab === "books" && <LibrosDashboard />}

            {activeTab === "requests" && (
              <SolicitudesDashboard
                requests={requests}
                formatDate={formatDate}
                onApprove={approveRequest}
                onReject={async (r, motivo) => {
                  if (!motivo || motivo.trim().length < 4) {
                    showToast("Ingresá un motivo (mínimo 4 caracteres)", "error");
                    return;
                  }
                  try {
                    await apiRejectRequest(r.id, motivo.trim());
                    setRequests((list) => list.filter((x) => x.id !== r.id));
                    showToast("Solicitud rechazada", "success");
                  } catch (e) {
                    showToast(e instanceof Error ? e.message : "Error", "error");
                  }
                }}
              />
            )}

            {activeTab === "penalties" && (
              <MultasDashboard
                penalties={penalties}
                tPenaltyStatus={tPenaltyStatus}
                formatDate={formatDate}
                markPenaltyPaid={markPenaltyPaid}
                deletePenalty={deletePenalty}
              />
            )}
          </div>
        </div>

        <Modal isOpen={isPenaltyModalOpen} onClose={() => setIsPenaltyModalOpen(false)} title="Aplicar multa" size="small">
          <div className={styles.modalForm}>
            <div className={styles.formGroupCompact}>
              <label>Usuario</label>
              <input type="text" value={selectedUser?.name ?? ""} disabled className={styles.inputCompact} />
            </div>

            <div className={styles.formGroupCompact}>
              <label>Tipo de multa</label>
              <select
                className={styles.inputCompact}
                value={penaltyType}
                onChange={(e) => {
                  const k = e.target.value as PenaltyTypeKey;
                  setPenaltyType(k);
                  setPenaltyAmount(String(PENALTY_TYPES[k].monto)); // display-only
                }}
              >
                {Object.entries(PENALTY_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formRowCompact}>
              <div className={styles.formGroupCompact}>
                <label>Monto ($) (referencia)</label>
                <input
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                  placeholder="0.00"
                  className={styles.inputCompact}
                  step="0.01"
                  readOnly
                  title="El monto real lo define el backend según el tipo de multa"
                />
              </div>
              <div className={styles.formGroupCompact}>
                <label>Detalle (opcional)</label>
                <input
                  value={penaltyDetail}
                  onChange={(e) => setPenaltyDetail(e.target.value)}
                  placeholder="Ej: libro con tapa dañada"
                  className={styles.inputCompact}
                />
              </div>
            </div>

            <div className={styles.modalActionsCompact}>
              <Button variant="outline" onClick={() => setIsPenaltyModalOpen(false)}>Cancelar</Button>
              <Button variant="danger" onClick={submitPenalty}>Aplicar</Button>
            </div>
          </div>
        </Modal>

        <Toast toasts={toasts} />
      </div>
    </Layout>
  );
}
