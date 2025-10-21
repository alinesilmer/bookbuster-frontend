"use client";

import { useEffect, useMemo, useState } from "react";
import { getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout/Layout";
import Modal from "@/components/Modal/Modal";
import {
  FiUsers,
  FiBook,
  FiUserCheck,
  FiAlertCircle,
  FiDollarSign,
  FiEdit,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Button from "@/components/Button/Button";
import styles from "@/styles/Admin.module.scss";
import {
  apiBooks,
  apiCopiesByBook,
  apiPenaltiesAll,
  apiEditorials,
  apiCreateBook,
  apiUpdateBook,
  apiCreateCopy,
  apiCreatePenalty,
  apiUpdatePenalty,
  apiDeletePenalty,
  apiDevSeed,
  apiSocioByUser,
  apiSociosAll,
  apiRegisterRequests,
  apiApproveRequest,
  apiRejectRequest,
} from "@/services/api";
import type {
  Book,
  Penalty,
  Editorial as EditorialT,
  FormatoCopia,
  SocioUser,
  RegisterRequest,
} from "@/types/models";
import Toast from "@/components/Toast/Toast";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  activeLoans: number;
  penalties: number;
  status: "active" | "suspended";
  usuarioId: string;
};

type AdminBook = {
  id: string;
  title: string;
  author: string;
  totalCopies: number;
  availableCopies: number;
  loanedCopies: number;
};

type ToastState = { id: string; message: string; type: "success" | "error" };

const tUserStatus = (s: string) =>
  s === "active" ? "Activo" : s === "suspended" ? "Suspendido" : s;

const tPenaltyStatus = (estado: string) =>
  estado === "PAGADA"
    ? "Pagada"
    : estado === "PENDIENTE"
    ? "Pendiente"
    : estado === "ANULADA"
    ? "Anulada"
    : estado;

const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
};

export default function Admin() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "users" | "books" | "requests" | "penalties"
  >("users");
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserEdit, setIsUserEdit] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isBookEdit, setIsBookEdit] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedBookForCopy, setSelectedBookForCopy] =
    useState<AdminBook | null>(null);
  const [selectedBookToEdit, setSelectedBookToEdit] =
    useState<AdminBook | null>(null);

  const [penaltyAmount, setPenaltyAmount] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [requests, setRequests] = useState<RegisterRequest[]>([]);
  const [editorials, setEditorials] = useState<EditorialT[]>([]);

  const [userForm, setUserForm] = useState({
    nombre: "",
    email: "",
    password: "",
    activo: true,
  });

  const [bookForm, setBookForm] = useState({
    titulo: "",
    descripcion: "",
    idioma: "",
    portada_url: "",
    fecha_publicacion: "",
    autoresCsv: "",
    generosCsv: "",
  });

  const [copyEditorialId, setCopyEditorialId] = useState("");
  const [copyIsbn, setCopyIsbn] = useState("");
  const [copyEdicion, setCopyEdicion] = useState("");
  const [copyFormato, setCopyFormato] = useState<FormatoCopia>("PDF");
  const [submittingCopy, setSubmittingCopy] = useState(false);

  const totalLoans = useMemo(
    () => books.reduce((sum, b) => sum + b.loanedCopies, 0),
    [books]
  );

  const showToast = (message: string, type: "success" | "error") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  useEffect(() => {
    const u = getUser();
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
        if (localStorage.getItem(seedKey)) return;
        const r = await apiDevSeed();
        if (r.created) localStorage.setItem(seedKey, "1");
      } catch {}
    };
    run();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const eds = await apiEditorials();
        setEditorials(eds);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Error cargando editoriales",
          "error"
        );
      }

      try {
        const list = await apiBooks();
        const mappedBooks: AdminBook[] = await Promise.all(
          list.map(async (b: Book) => {
            const copies = await apiCopiesByBook(b.id);
            const total = copies.length;
            const available = copies.filter(
              (c) => c.estado === "DISPONIBLE"
            ).length;
            const loaned = total - available;
            const author =
              b.autores.length > 0 ? b.autores[0].nombre : "Varios";
            return {
              id: b.id,
              title: b.titulo,
              author,
              totalCopies: total,
              availableCopies: available,
              loanedCopies: loaned,
            };
          })
        );
        setBooks(mappedBooks);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Error cargando libros",
          "error"
        );
      }

      try {
        const listSocios = await apiSociosAll();
        const mappedUsers: AdminUser[] = listSocios.map((s: SocioUser) => ({
          id: s.id,
          usuarioId: s.usuario_id,
          name: s.nombre,
          email: s.email,
          activeLoans: s.prestamos_activos,
          penalties: s.multas_pendientes,
          status: s.activo ? "active" : "suspended",
        }));
        setUsers(mappedUsers);
      } catch (e) {
        showToast(
          e instanceof Error ? e.message : "Error cargando usuarios",
          "error"
        );
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
  }, []);

  const openAddUser = () => {
    setIsUserEdit(false);
    setUserForm({ nombre: "", email: "", password: "", activo: true });
    setIsUserModalOpen(true);
  };

  const openEditUser = (u: AdminUser) => {
    setIsUserEdit(true);
    setUserForm({
      nombre: u.name,
      email: u.email,
      password: "",
      activo: u.status === "active",
    });
    setSelectedUser(u);
    setIsUserModalOpen(true);
  };

  const submitUser = async () => {
    setIsUserModalOpen(false);
  };

  const suspendUser = async (_u: AdminUser) => {
    showToast("Acción no disponible", "error");
  };

  const openAddBook = () => {
    setIsBookEdit(false);
    setBookForm({
      titulo: "",
      descripcion: "",
      idioma: "",
      portada_url: "",
      fecha_publicacion: "",
      autoresCsv: "",
      generosCsv: "",
    });
    setIsBookModalOpen(true);
  };

  const openEditBook = (b: AdminBook) => {
    setIsBookEdit(true);
    setSelectedBookToEdit(b);
    setBookForm({
      titulo: b.title,
      descripcion: "",
      idioma: "",
      portada_url: "",
      fecha_publicacion: "",
      autoresCsv: "",
      generosCsv: "",
    });
    setIsBookModalOpen(true);
  };

  const submitBook = async () => {
    try {
      if (isBookEdit && selectedBookToEdit) {
        await apiUpdateBook(selectedBookToEdit.id, {
          titulo: bookForm.titulo || undefined,
          descripcion: bookForm.descripcion || undefined,
          idioma: bookForm.idioma || undefined,
          portada_url: bookForm.portada_url || undefined,
          fecha_publicacion: bookForm.fecha_publicacion || undefined,
          autores:
            bookForm.autoresCsv.trim().length > 0
              ? bookForm.autoresCsv
                  .split(",")
                  .map((n) => ({ nombre: n.trim() }))
              : undefined,
          generos:
            bookForm.generosCsv.trim().length > 0
              ? bookForm.generosCsv
                  .split(",")
                  .map((n) => ({ nombre: n.trim() }))
              : undefined,
        });
        setBooks((list) =>
          list.map((x) =>
            x.id === selectedBookToEdit.id
              ? { ...x, title: bookForm.titulo || x.title }
              : x
          )
        );
        showToast("Libro actualizado", "success");
      } else {
        const created = await apiCreateBook({
          titulo: bookForm.titulo,
          descripcion: bookForm.descripcion || null,
          idioma: bookForm.idioma || "ES",
          portada_url: bookForm.portada_url || null,
          fecha_publicacion: bookForm.fecha_publicacion || null,
          autores:
            bookForm.autoresCsv.trim().length > 0
              ? bookForm.autoresCsv
                  .split(",")
                  .map((n) => ({ nombre: n.trim() }))
              : [],
          generos:
            bookForm.generosCsv.trim().length > 0
              ? bookForm.generosCsv
                  .split(",")
                  .map((n) => ({ nombre: n.trim() }))
              : [],
        });
        setBooks((list) => [
          ...list,
          {
            id: created.id,
            title: bookForm.titulo,
            author:
              bookForm.autoresCsv.trim().length > 0
                ? bookForm.autoresCsv.split(",")[0].trim()
                : "Varios",
            totalCopies: 0,
            availableCopies: 0,
            loanedCopies: 0,
          },
        ]);
        showToast("Libro creado", "success");
      }
      setIsBookModalOpen(false);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  const openAddCopy = (b: AdminBook) => {
    setSelectedBookForCopy(b);
    setCopyEditorialId(editorials[0]?.id ?? "");
    setCopyFormato("PDF");
    setCopyIsbn("");
    setCopyEdicion("");
    setIsCopyModalOpen(true);
  };

  const handleCreateCopy = async () => {
    try {
      if (!selectedBookForCopy || !copyEditorialId) return;
      setSubmittingCopy(true);
      await apiCreateCopy({
        libro_id: selectedBookForCopy.id,
        editorial_id: copyEditorialId,
        formato: copyFormato,
        isbn: copyIsbn || null,
        edicion: copyEdicion || null,
      });
      setBooks((list) =>
        list.map((x) =>
          x.id === selectedBookForCopy.id
            ? {
                ...x,
                totalCopies: x.totalCopies + 1,
                availableCopies: x.availableCopies + 1,
              }
            : x
        )
      );
      setIsCopyModalOpen(false);
      showToast("Copia agregada", "success");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    } finally {
      setSubmittingCopy(false);
    }
  };

  const openPenalty = (u: AdminUser) => {
    setSelectedUser(u);
    setPenaltyAmount("");
    setPenaltyReason("");
    setIsPenaltyModalOpen(true);
  };

  const submitPenalty = async () => {
    try {
      if (!selectedUser) return;
      const socio = await apiSocioByUser(selectedUser.usuarioId);
      await apiCreatePenalty({
        socio_id: socio.id,
        monto: Number.parseFloat(penaltyAmount),
        motivo: penaltyReason,
        prestamo_id: null,
      });
      const pen = await apiPenaltiesAll();
      setPenalties(pen);
      showToast("Multa creada", "success");
      setIsPenaltyModalOpen(false);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  const markPenaltyPaid = async (p: Penalty) => {
    try {
      await apiUpdatePenalty(p.id, { estado: "PAGADA" });
    } catch {}
    setPenalties((list) =>
      list.map((x) => (x.id === p.id ? { ...x, estado: "PAGADA" } : x))
    );
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
      const listSocios = await apiSociosAll();
      setUsers(
        listSocios.map((s) => ({
          id: s.id,
          usuarioId: s.usuario_id,
          name: s.nombre,
          email: s.email,
          activeLoans: s.prestamos_activos,
          penalties: s.multas_pendientes,
          status: s.activo ? "active" : "suspended",
        }))
      );
      const updated = await apiRegisterRequests();
      setRequests(updated);
      showToast("Solicitud aprobada", "success");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Error";
      showToast(m, "error");
    }
  };

  const rejectRequest = async (req: RegisterRequest) => {
    try {
      await apiRejectRequest(req.id);
      setRequests((list) => list.filter((x) => x.id !== req.id));
      showToast("Solicitud rechazada", "success");
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
            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                className={styles.statIcon}
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <FiUsers />
              </div>
              <div className={styles.statContent}>
                <h3>Total de usuarios</h3>
                <p className={styles.statValue}>{users.length}</p>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className={styles.statIcon}
                style={{
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                }}
              >
                <FiBook />
              </div>
              <div className={styles.statContent}>
                <h3>Total de libros</h3>
                <p className={styles.statValue}>{books.length}</p>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className={styles.statIcon}
                style={{
                  background:
                    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                }}
              >
                <FiUserCheck />
              </div>
              <div className={styles.statContent}>
                <h3>Solicitudes pendientes</h3>
                <p className={styles.statValue}>{requests.length}</p>
              </div>
            </motion.div>

            <motion.div
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div
                className={styles.statIcon}
                style={{
                  background:
                    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
                }}
              >
                <FiAlertCircle />
              </div>
              <div className={styles.statContent}>
                <h3>Préstamos activos</h3>
                <p className={styles.statValue}>{totalLoans}</p>
              </div>
            </motion.div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "users" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("users")}
            >
              <FiUsers /> Usuarios
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "books" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("books")}
            >
              <FiBook /> Libros
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "requests" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("requests")}
            >
              <FiUserCheck /> Solicitudes de registro
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "penalties" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("penalties")}
            >
              <FiDollarSign /> Multas
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === "users" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.tableWrapper}
              >
                <div className={styles.tableHeader}>
                  <h2>Gestión de usuarios</h2>
                </div>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Préstamos activos</th>
                        <th>Multas pendientes</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.activeLoans}</td>
                          <td>${user.penalties.toFixed(2)}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                styles[user.status]
                              }`}
                            >
                              {tUserStatus(user.status)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => openEditUser(user)}
                              >
                                <FiEdit /> Editar
                              </Button>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => openPenalty(user)}
                              >
                                <FiDollarSign /> Multar
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => suspendUser(user)}
                              >
                                Suspender
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "books" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.tableWrapper}
              >
                <div className={styles.tableHeader}>
                  <h2>Inventario de libros</h2>
                  <Button variant="primary" size="small" onClick={openAddBook}>
                    <FiPlus /> Agregar libro
                  </Button>
                </div>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Autor</th>
                        <th>Copias totales</th>
                        <th>Disponibles</th>
                        <th>Prestadas</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book.id}>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.totalCopies}</td>
                          <td>
                            <span className={styles.availability}>
                              {book.availableCopies}
                            </span>
                          </td>
                          <td>{book.loanedCopies}</td>
                          <td>
                            <div className={styles.actions}>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => openEditBook(book)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => openAddCopy(book)}
                              >
                                Agregar copia
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "requests" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.requestsGrid}
              >
                {requests.map((r) => (
                  <div key={r.id} className={styles.requestCard}>
                    <h3>{r.nombre}</h3>
                    <p>{r.email}</p>
                    <p>Fecha: {formatDate(r.fecha)}</p>
                    <div className={styles.requestActions}>
                      <Button
                        variant="primary"
                        onClick={() => approveRequest(r)}
                      >
                        Aprobar
                      </Button>
                      <Button variant="danger" onClick={() => rejectRequest(r)}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "penalties" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.tableWrapper}
              >
                <div className={styles.tableHeader}>
                  <h2>Gestión de multas</h2>
                </div>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Monto</th>
                        <th>Motivo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {penalties.map((penalty) => (
                        <tr key={penalty.id}>
                          <td>{penalty.socio?.nombre ?? "-"}</td>
                          <td>${penalty.monto.toFixed(2)}</td>
                          <td>{penalty.motivo}</td>
                          <td>{formatDate(penalty.fecha)}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                styles[penalty.estado.toLowerCase()]
                              }`}
                            >
                              {tPenaltyStatus(penalty.estado)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => markPenaltyPaid(penalty)}
                              >
                                Marcar como pagada
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => deletePenalty(penalty)}
                              >
                                <FiTrash2 />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <Modal
          isOpen={isPenaltyModalOpen}
          onClose={() => setIsPenaltyModalOpen(false)}
          title="Aplicar multa"
          size="medium"
        >
          <div className={styles.penaltyForm}>
            <div className={styles.formGroup}>
              <label>Usuario</label>
              <input
                type="text"
                value={selectedUser?.name ?? ""}
                disabled
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Monto de la multa ($)</label>
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                placeholder="0.00"
                className={styles.input}
                step="0.01"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Motivo</label>
              <textarea
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                placeholder="Ingrese el motivo de la multa"
                className={styles.textarea}
                rows={4}
              />
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsPenaltyModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="danger" fullWidth onClick={submitPenalty}>
                Aplicar multa
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title={isUserEdit ? "Editar usuario" : "Agregar usuario"}
          size="medium"
        >
          <div className={styles.penaltyForm}>
            <div className={styles.formGroup}>
              <label>Nombre</label>
              <input
                type="text"
                value={userForm.nombre}
                onChange={(e) =>
                  setUserForm((f) => ({ ...f, nombre: e.target.value }))
                }
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Correo</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm((f) => ({ ...f, email: e.target.value }))
                }
                className={styles.input}
              />
            </div>
            {!isUserEdit && (
              <div className={styles.formGroup}>
                <label>Contraseña</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
            )}
            {isUserEdit && (
              <div className={styles.formGroup}>
                <label>Activo</label>
                <select
                  value={userForm.activo ? "1" : "0"}
                  onChange={(e) =>
                    setUserForm((f) => ({
                      ...f,
                      activo: e.target.value === "1",
                    }))
                  }
                  className={styles.input}
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
            )}
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsUserModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="primary" fullWidth onClick={submitUser}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title={isBookEdit ? "Editar libro" : "Agregar libro"}
          size="large"
        >
          <div className={styles.penaltyForm}>
            <div className={styles.formGroup}>
              <label>Título</label>
              <input
                type="text"
                value={bookForm.titulo}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, titulo: e.target.value }))
                }
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                value={bookForm.descripcion}
                onChange={(e) =>
                  setBookForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                className={styles.textarea}
                rows={3}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Idioma</label>
                <input
                  type="text"
                  value={bookForm.idioma}
                  onChange={(e) =>
                    setBookForm((f) => ({ ...f, idioma: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Fecha publicación</label>
                <input
                  type="date"
                  value={bookForm.fecha_publicacion}
                  onChange={(e) =>
                    setBookForm((f) => ({
                      ...f,
                      fecha_publicacion: e.target.value,
                    }))
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Portada URL</label>
                <input
                  type="url"
                  value={bookForm.portada_url}
                  onChange={(e) =>
                    setBookForm((f) => ({ ...f, portada_url: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Autores (coma)</label>
                <input
                  type="text"
                  value={bookForm.autoresCsv}
                  onChange={(e) =>
                    setBookForm((f) => ({ ...f, autoresCsv: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Géneros (coma)</label>
                <input
                  type="text"
                  value={bookForm.generosCsv}
                  onChange={(e) =>
                    setBookForm((f) => ({ ...f, generosCsv: e.target.value }))
                  }
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsBookModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="primary" fullWidth onClick={submitBook}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          title="Agregar copia"
          size="medium"
        >
          <div className={styles.copyForm}>
            <div className={styles.formGroup}>
              <label>Libro</label>
              <input
                type="text"
                className={styles.input}
                value={selectedBookForCopy?.title ?? ""}
                disabled
              />
            </div>
            <div className={styles.formGroup}>
              <label>Editorial</label>
              <select
                className={styles.select}
                value={copyEditorialId}
                onChange={(e) => setCopyEditorialId(e.target.value)}
              >
                <option value="">Seleccionar editorial</option>
                {editorials.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>ISBN</label>
                <input
                  type="text"
                  className={styles.input}
                  value={copyIsbn}
                  onChange={(e) => setCopyIsbn(e.target.value)}
                  placeholder="978-..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Edición</label>
                <input
                  type="text"
                  className={styles.input}
                  value={copyEdicion}
                  onChange={(e) => setCopyEdicion(e.target.value)}
                  placeholder="1ra, 2da..."
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Formato</label>
                <select
                  className={styles.select}
                  value={copyFormato}
                  onChange={(e) =>
                    setCopyFormato(e.target.value as FormatoCopia)
                  }
                >
                  <option value="PDF">PDF</option>
                  <option value="EPUB">EPUB</option>
                  <option value="AUDIOBOOK">AUDIOBOOK</option>
                </select>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => setIsCopyModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleCreateCopy}
                loading={submittingCopy}
              >
                Crear copia
              </Button>
            </div>
          </div>
        </Modal>

        <Toast toasts={toasts} />
      </div>
    </Layout>
  );
}
