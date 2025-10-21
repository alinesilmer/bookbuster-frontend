"use client";

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout/Layout";
import BookCard from "@/components/BookCard/BookCard";
import SearchBar from "@/components/SearchBar/SearchBar";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button/Button";
import styles from "@/styles/Home.module.scss";
import { motion } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel/HeroCarousel";
import Image from "next/image";
import { apiBooks, apiCopiesByBook } from "@/services/api";
import type { Book, UIBook } from "@/types/models";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [uiBooks, setUiBooks] = useState<UIBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<UIBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let done = false;
    const load = async () => {
      const list = await apiBooks();
      const mapped: UIBook[] = await Promise.all(
        list.map(async (b: Book) => {
          const copies = await apiCopiesByBook(b.id);
          const total = copies.length;
          const available = copies.filter(
            (c) => c.estado === "DISPONIBLE"
          ).length;
          const author = b.autores.length > 0 ? b.autores[0].nombre : "Varios";
          const genre =
            b.generos.length > 0 ? b.generos[0].nombre : "Sin género";
          return {
            id: b.id,
            title: b.titulo,
            author,
            cover: b.portada_url ?? null,
            availableCopies: available,
            totalCopies: total,
            genre,
            description: b.descripcion ?? null,
          };
        })
      );
      if (!done) setUiBooks(mapped);
    };
    load();
    return () => {
      done = true;
    };
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>(["All"]);
    uiBooks.forEach((b) => set.add(b.genre));
    return Array.from(set);
  }, [uiBooks]);

  const filteredBooks = useMemo(() => {
    return uiBooks.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre =
        selectedGenre === "All" || book.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [uiBooks, searchQuery, selectedGenre]);

  const handleBookClick = (book: UIBook) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <Layout>
      <HeroCarousel />

      <div className={styles.home}>
        <div className="container">
          <div className={styles.controls}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar libros o autores..."
            />

            <div className={styles.genres}>
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`${styles.genreBtn} ${
                    selectedGenre === genre ? styles.active : ""
                  }`}
                  onClick={() => setSelectedGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            className={styles.booksGrid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleBookClick(book)}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Book Details"
          size="large"
        >
          {selectedBook && (
            <div className={styles.bookDetails}>
              <div className={styles.detailsGrid}>
                <Image
                  src={selectedBook.cover || "/placeholder.svg"}
                  alt={selectedBook.title}
                  className={styles.detailsCover}
                  width={240}
                  height={340}
                />
                <div className={styles.detailsInfo}>
                  <h2>{selectedBook.title}</h2>
                  <p className={styles.author}>by {selectedBook.author}</p>
                  <div className={styles.badge}>{selectedBook.genre}</div>

                  <div className={styles.availability}>
                    <h3>Availability</h3>
                    <p>
                      {selectedBook.availableCopies} of{" "}
                      {selectedBook.totalCopies} copies available
                    </p>
                  </div>

                  <div className={styles.description}>
                    <h3>Description</h3>
                    <p>{selectedBook.description ?? "Sin descripción"}</p>
                  </div>

                  <div className={styles.actions}>
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={selectedBook.availableCopies === 0}
                    >
                      {selectedBook.availableCopies > 0
                        ? "Borrow Book"
                        : "Out of Stock"}
                    </Button>
                    <Button variant="outline" fullWidth>
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
