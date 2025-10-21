"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout/Layout";
import StatsCard from "@/components/StatsCard/StatsCard";
import EmptyState from "@/components/EmptyState/EmptyState";
import {
  FiBook,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiBookOpen,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Button from "@/components/Button/Button";
import styles from "@/styles/Dashboard.module.scss";
import type { Loan, Penalty } from "@/types/models";
import { apiPenaltiesAll, apiSocioByUser } from "@/services/api";
import { getUser } from "@/lib/auth";

const MOCK_LOANS: Loan[] = [
  {
    id: "1",
    bookTitle: "El gran Gatsby",
    bookCover: "/great-gatsby-book.png",
    loanDate: "2025-01-05",
    dueDate: "2025-01-19",
    status: "active",
  },
  {
    id: "2",
    bookTitle: "Matar a un ruiseñor",
    bookCover: "/to-kill-a-mockingbird-book.jpg",
    loanDate: "2025-01-10",
    dueDate: "2025-01-24",
    status: "active",
  },
];

const MOCK_HISTORY: Loan[] = [
  {
    id: "3",
    bookTitle: "1984",
    loanDate: "2024-12-01",
    dueDate: "2024-12-15",
    status: "returned",
  },
  {
    id: "4",
    bookTitle: "Orgullo y prejuicio",
    loanDate: "2024-11-15",
    dueDate: "2024-12-05",
    status: "late",
    penalty: 5.0,
  },
];

const formatDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
};

const daysUntil = (iso: string): number => {
  const due = new Date(`${iso}T00:00:00Z`);
  const now = new Date();
  const utcToday = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const utcDue = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate()
  );
  return Math.ceil((utcDue - utcToday) / 86400000);
};

const tLoanStatus = (s: string) =>
  s === "active"
    ? "activo"
    : s === "returned"
    ? "devuelto"
    : s === "late"
    ? "atrasado"
    : s;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"loans" | "history" | "penalties">(
    "loans"
  );
  const [penalties, setPenalties] = useState<Penalty[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const u = getUser();
        if (!u) return;
        const socio = await apiSocioByUser(u.id);
        const all = await apiPenaltiesAll();
        const mine = all.filter((p) => p.socio?.id === socio.id);
        setPenalties(mine);
      } catch {}
    };
    load();
  }, []);

  const totalPenalty = useMemo(
    () => penalties.reduce((sum, p) => sum + p.monto, 0),
    [penalties]
  );

  const getDaysRemaining = daysUntil;

  return (
    <Layout>
      <motion.div
        className={styles.dashboard}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container">
          <h1 className="page-title">Mi panel</h1>

          <div className={styles.stats}>
            <StatsCard
              icon={<FiBook />}
              title="Préstamos activos"
              value={MOCK_LOANS.length}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              delay={0.1}
            />
            <StatsCard
              icon={<FiBookOpen />}
              title="Libros leídos"
              value={MOCK_HISTORY.length}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              delay={0.2}
            />
            <StatsCard
              icon={<FiAlertCircle />}
              title="Multas"
              value={`$${totalPenalty.toFixed(2)}`}
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              delay={0.3}
            />
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${
                activeTab === "loans" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("loans")}
            >
              <FiBook /> Préstamos
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "history" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              <FiClock /> Historial
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "penalties" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("penalties")}
            >
              <FiAlertCircle /> Multas
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === "loans" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.loansGrid}
              >
                {MOCK_LOANS.length > 0 ? (
                  MOCK_LOANS.map((loan) => {
                    const daysRemaining = getDaysRemaining(loan.dueDate);
                    const isUrgent = daysRemaining <= 3;
                    return (
                      <motion.div
                        key={loan.id}
                        className={styles.loanCard}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img
                          src={loan.bookCover || "/placeholder.svg"}
                          alt={loan.bookTitle}
                          className={styles.bookCover}
                        />
                        <div className={styles.loanInfo}>
                          <h3>{loan.bookTitle}</h3>
                          <div className={styles.dates}>
                            <div className={styles.dateItem}>
                              <FiCalendar />
                              <span>Prestado: {formatDate(loan.loanDate)}</span>
                            </div>
                            <div
                              className={`${styles.dateItem} ${
                                isUrgent ? styles.urgent : ""
                              }`}
                            >
                              <FiClock />
                              <span>Vence: {formatDate(loan.dueDate)}</span>
                            </div>
                          </div>
                          <div
                            className={`${styles.daysRemaining} ${
                              isUrgent ? styles.urgent : ""
                            }`}
                          >
                            {daysRemaining > 0
                              ? `${daysRemaining} días restantes`
                              : `${Math.abs(daysRemaining)} días de atraso`}
                          </div>
                          <Button variant="outline" size="small" fullWidth>
                            Extender préstamo
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={<FiBook />}
                    title="Sin préstamos activos"
                    description="No tenés libros prestados por el momento. ¡Explorá nuestra colección para encontrar tu próxima lectura!"
                    actionLabel="Explorar libros"
                    onAction={() => (window.location.href = "/")}
                  />
                )}
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.table}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Fecha de préstamo</th>
                      <th>Fecha de devolución</th>
                      <th>Estado</th>
                      <th>Multa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_HISTORY.map((item) => (
                      <tr key={item.id}>
                        <td>{item.bookTitle}</td>
                        <td>{formatDate(item.loanDate)}</td>
                        <td>{formatDate(item.dueDate)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${styles[item.status]}`}
                          >
                            {tLoanStatus(item.status)}
                          </span>
                        </td>
                        <td>
                          {item.penalty ? `$${item.penalty.toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === "penalties" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.penaltiesGrid}
              >
                {penalties.length > 0 ? (
                  penalties.map((penalty) => (
                    <motion.div
                      key={penalty.id}
                      className={styles.penaltyCard}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={styles.penaltyHeader}>
                        <h3>{penalty.socio?.nombre ?? "Socio"}</h3>
                        <span className={styles.amount}>
                          ${penalty.monto.toFixed(2)}
                        </span>
                      </div>
                      <p className={styles.reason}>{penalty.motivo}</p>
                      <p className={styles.date}>
                        Fecha: {formatDate(penalty.fecha)}
                      </p>
                      <Button variant="danger" size="small" fullWidth>
                        Pagar ahora
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    icon={<FiAlertCircle />}
                    title="Sin multas"
                    description="¡Genial! No tenés multas pendientes."
                  />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
