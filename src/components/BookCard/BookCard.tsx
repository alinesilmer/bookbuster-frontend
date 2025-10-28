import { useState } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import Button from "@/components/Button/Button";
import styles from "./BookCard.module.scss";
import type { UIBook } from "@/types/models";
import BookDetailsModal from "../BookDetailsModal/BookDetailsModal";

type BookCardProps = { book: UIBook };

export default function BookCard({ book }: BookCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availableCount, setAvailableCount] = useState(book.availableCopies);
  const isAvailable = availableCount > 0;
  const coverSrc = book.cover ?? "/placeholder.svg";

  return (
    <>
      <motion.div className={styles.bookCard} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
        <div className={styles.coverWrapper}>
          <img src={coverSrc} alt={book.title} className={styles.cover} />
          <div className={styles.overlay}>
            <Button variant="primary" size="small" onClick={() => setIsOpen(true)}>Ver más</Button>
          </div>
          <div className={`${styles.status} ${isAvailable ? styles.available : styles.unavailable}`}>
            {isAvailable ? <FiCheckCircle /> : <FiXCircle />}
            {isAvailable ? "Available" : "Out of Stock"}
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{book.title}</h3>
          <p className={styles.author}>{book.author}</p>
          <div className={styles.footer}>
            <span className={styles.genre}>{book.genre}</span>
            <span className={styles.copies}>{availableCount}/{book.totalCopies} copies</span>
          </div>
        </div>
      </motion.div>

      <BookDetailsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        book={book}
        onLoanSuccess={() => setAvailableCount((n) => Math.max(0, n - 1))}
      />
    </>
  );
}
