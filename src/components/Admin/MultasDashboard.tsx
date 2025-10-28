
"use client";

import Button from "@/components/Button/Button";
import styles from "./MultasDashboard.module.scss";
import type { Penalty } from "@/types/models";

type Props = {
  penalties: Penalty[];
  tPenaltyStatus: (s: string) => string;
  formatDate: (iso: string) => string;
  markPenaltyPaid: (p: Penalty) => void;
  deletePenalty: (p: Penalty) => void;
};

export default function MultasDashboard({ penalties, tPenaltyStatus, formatDate, markPenaltyPaid, deletePenalty }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}><h2>Gestión de multas</h2></div>
      <div className={styles.tableBox}>
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
            {penalties.map((p) => (
              <tr key={p.id}>
                <td>{p.socio?.nombre ?? "-"}</td>
                <td>${p.monto.toFixed(2)}</td>
                <td>{p.motivo}</td>
                <td>{formatDate(p.fecha)}</td>
                <td><span className={`${styles.badge} ${styles[p.estado.toLowerCase()]}`}>{tPenaltyStatus(p.estado)}</span></td>
                <td>
                  <div className={styles.actions}>
                    <Button variant="primary" size="small" onClick={() => markPenaltyPaid(p)}>Marcar como pagada</Button>
                    <Button variant="danger" size="small" onClick={() => deletePenalty(p)}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
            {penalties.length === 0 && (
              <tr>
                <td className={styles.empty} colSpan={6}>Sin multas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
