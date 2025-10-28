"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button/Button";
import AddCopyModal from "@/components/AddCopyModal/AddCopyModal";
import EditBookModal from "@/components/EditBookModal/EditBookModal";
import AddBookModal from "@/components/AddBookModal/AddBookModal";
import { apiBooks, apiCopiesByBook } from "@/services/api";
import styles from "./LibrosDashboard.module.scss";

export type AdminBook = {
  id: string;
  title: string;
  author: string;
  totalCopies: number;
  availableCopies: number;
  loanedCopies: number;
};

export default function LibrosDashboard() {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCopyFor, setAddCopyFor] = useState<AdminBook | null>(null);
  const [editBook, setEditBook] = useState<AdminBook | null>(null);
  const [addBookOpen, setAddBookOpen] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const raw = await apiBooks();
      const enriched: AdminBook[] = await Promise.all(
        raw.map(async (b) => {
          const copies = await apiCopiesByBook(b.id);
          const total = copies.length;
          const available = copies.filter((c) => c.estado === "DISPONIBLE").length;
          const loaned = total - available;
          const author = b.autores?.[0]?.nombre ?? "—";
          return { id: b.id, title: b.titulo, author, totalCopies: total, availableCopies: available, loanedCopies: loaned };
        })
      );
      setBooks(enriched);
      window.dispatchEvent(new CustomEvent("books:updated"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    const handler = () => fetchBooks();
    window.addEventListener("books:updated", handler as EventListener);
    return () => window.removeEventListener("books:updated", handler as EventListener);
  }, []);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2>Inventario de libros</h2>
          <Button variant="primary" size="small" onClick={() => setAddBookOpen(true)}>Agregar libro</Button>
        </div>
        <div className={styles.tableBox}>
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
              {books.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.totalCopies}</td>
                  <td><span className={styles.availability}>{b.availableCopies}</span></td>
                  <td>{b.loanedCopies}</td>
                  <td>
                    <div className={styles.actions}>
                      <Button variant="outline" size="small" onClick={() => setEditBook(b)}>Editar</Button>
                      <Button variant="secondary" size="small" onClick={() => setAddCopyFor(b)}>Agregar copia</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && books.length === 0 && (
                <tr>
                  <td className={styles.empty} colSpan={6}>Sin libros</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addCopyFor && (
        <AddCopyModal
          isOpen={!!addCopyFor}
          onClose={() => setAddCopyFor(null)}
          libroId={addCopyFor.id}
          onCreated={fetchBooks}
        />
      )}

      {editBook && (
        <EditBookModal
          isOpen={!!editBook}
          onClose={() => setEditBook(null)}
          book={{ id: editBook.id, title: editBook.title, author: editBook.author }}
          onUpdated={fetchBooks}
        />
      )}

      {addBookOpen && (
        <AddBookModal
          isOpen={addBookOpen}
          onClose={() => setAddBookOpen(false)}
          onCreated={fetchBooks}
        />
      )}
    </>
  );
}
