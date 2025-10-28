
"use client";

import { useState } from "react";
import Button from "@/components/Button/Button";
import styles from "./SolicitudesDashboard.module.scss";
import type { RegisterRequest } from "@/types/models";

type Props = {
  requests: RegisterRequest[];
  formatDate: (iso: string) => string;
  onApprove: (req: RegisterRequest) => Promise<void>;
  onReject: (req: RegisterRequest, motivo: string) => Promise<void>;
};

export default function SolicitudesDashboard({ requests, formatDate, onApprove, onReject }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));
  return (
    <div className={styles.list}>
      {requests.map((r) => {
        const expanded = openId === r.id;
        return (
          <div key={r.id} className={styles.card}>
            <div className={styles.head}>
              <div className={styles.titleBox}>
                <h3>{r.nombre}</h3>
                <p className={styles.email}>{r.email}</p>
              </div>
              <div className={styles.meta}>Fecha: {formatDate(r.fecha)}</div>
            </div>
            {expanded && (
              <div className={styles.body}>
                <div className={styles.row}>
                  <span className={styles.label}>Teléfono</span>
                  <span className={styles.val}>{r.telefono || "-"}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Estado</span>
                  <span className={styles.badge}>{r.estado}</span>
                </div>
                <div className={styles.rejectBox}>
                  <label htmlFor={`motivo_${r.id}`}>Motivo de rechazo</label>
                  <textarea
                    id={`motivo_${r.id}`}
                    rows={3}
                    placeholder="Explicá el motivo"
                    value={motivo[r.id] ?? ""}
                    onChange={(e) => setMotivo((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <div className={styles.actions}>
              <Button variant="outline" onClick={() => toggle(r.id)}>{expanded ? "Ver menos" : "Ver más"}</Button>
              <Button variant="primary" onClick={() => onApprove(r)}>Aprobar</Button>
              <Button variant="danger" onClick={() => onReject(r, (motivo[r.id] ?? "").trim())}>Rechazar</Button>
            </div>
          </div>
        );
      })}
      {requests.length === 0 && <div className={styles.empty}>No hay solicitudes pendientes.</div>}
    </div>
  );
}
