"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import { FiEdit, FiDollarSign, FiRotateCcw } from "react-icons/fi";
import dynamic from "next/dynamic";
import styles from "./UsuariosDashboard.module.scss";
import UserEditModal from "../UserEditModal/UserEditModal";

const ReturnLoanQuickModal = dynamic(() => import("../ReturnLoanQuickModal/ReturnLoanQuickModal"), { ssr: false });

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  activeLoans: number;
  penalties: number;
  status: "active" | "suspended";
  usuarioId: string;
  nro_socio?: number | null;
};

type Props = {
  users: AdminUser[];
  tUserStatus: (s: string) => string;
  openEditUser: (u: AdminUser) => void;
  openPenalty: (u: AdminUser) => void;
  suspendUser: (u: AdminUser) => void;
  onSaveUser: (id: string, payload: { nombre: string; email: string }) => Promise<void>;
};

export default function UsuariosDashboard({ users, tUserStatus, openEditUser, openPenalty, suspendUser, onSaveUser }: Props) {
  const [returnFor, setReturnFor] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2>Gestión de usuarios</h2>
      </div>
      <div className={styles.tableBox}>
        <table>
          <thead>
            <tr>
              <th>N° Socio</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Préstamos activos</th>
              <th>Multas pendientes</th>
              <th>Estado</th>
              <th style={{ width: 340 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.nro_socio ?? "-"}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.activeLoans}</td>
                <td>${u.penalties.toFixed(2)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[u.status]}`}>{tUserStatus(u.status)}</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="outline" size="small" onClick={() => setEditUser(u)}>
                      <FiEdit /> Editar
                    </Button>
                    <Button variant="secondary" size="small" onClick={() => openPenalty(u)}>
                      <FiDollarSign /> Multar
                    </Button>
                    <Button variant="outline" size="small" onClick={() => setReturnFor(u)} title="Devolver préstamo">
                      <FiRotateCcw /> Devolver
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={7}>Sin usuarios</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {returnFor && (
        <ReturnLoanQuickModal
          isOpen={!!returnFor}
          onClose={() => setReturnFor(null)}
          userName={returnFor.name}
          usuarioId={returnFor.usuarioId}
          onReturned={() => setReturnFor(null)}
        />
      )}

      {editUser && (
        <UserEditModal
          isOpen={!!editUser}
          user={{ id: editUser.id, nombre: editUser.name, email: editUser.email, nro_socio: editUser.nro_socio ?? null }}
          onClose={() => setEditUser(null)}
          onSave={(payload) => onSaveUser(editUser.id, payload)}
        />
      )}
    </div>
  );
}
