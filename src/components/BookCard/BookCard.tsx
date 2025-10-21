"use client";

import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import Button from "@/components/Button/Button";
import styles from "./BookCard.module.scss";
import type { UIBook } from "@/types/models";

type BookCardProps = {
  book: UIBook;
};

export default function BookCard({ book }: BookCardProps) {
  const isAvailable = book.availableCopies > 0;
  const coverSrc = book.cover ?? "/placeholder.svg";

  return (
    <motion.div
      className={styles.bookCard}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.coverWrapper}>
        <img src={coverSrc} alt={book.title} className={styles.cover} />
        <div className={styles.overlay}>
          <Button variant="primary" size="small">
            Alquilar
          </Button>
        </div>
        <div
          className={`${styles.status} ${
            isAvailable ? styles.available : styles.unavailable
          }`}
        >
          {isAvailable ? <FiCheckCircle /> : <FiXCircle />}
          {isAvailable ? "Available" : "Out of Stock"}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>

        <div className={styles.footer}>
          <span className={styles.genre}>{book.genre}</span>
          <span className={styles.copies}>
            {book.availableCopies}/{book.totalCopies} copies
          </span>
        </div>
      </div>
    </motion.div>
  );
}
