"use client";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StaticImageData } from "next/image";
import styles from "./HeroCarousel.module.scss";
import Hero from "../../assets/images/bgHero.png";
import Hero2 from "../../assets/images/heroBg2.png";
import Hero3 from "../../assets/images/heroBg3.png";
import Button from "../Button/Button";

type Align = "left" | "center" | "right";

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  image: string | StaticImageData;
  cta?: string;
  align?: Align;
};

const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const hovering = useRef(false);

  const slides: Slide[] = useMemo(
    () => [
      {
        id: 1,
        title: "Bienvenido a Bookbuster",
        subtitle: "Alquilá un viaje hacia millones de aventuras 🚀",
        image: Hero,
        cta: "EXPLORAR YA",
        align: "left",
      },
      {
        id: 2,
        title: "Aventuras en un click",
        subtitle: "Disfruta de nuestro amplio catálogo de historias",
        image: Hero2,
        cta: "VER CATÁLOGO",
        align: "left",
      },
      {
        id: 3,
        title: "Promociones únicas",
        subtitle: "Obten acceso a descuentos y ofertas de lectura",
        image: Hero3,
        cta: "CONOCER MÁS",
        align: "left",
      },
    ],
    []
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const id = setInterval(() => {
      if (!hovering.current) setCurrent((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  const go = (n: number) => setCurrent((n + slides.length) % slides.length);
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  return (
    <section
      className={styles.heroSection}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <div className={styles.heroContainer}>
        {slides.map((s, i) => {
          const bg =
            typeof s.image === "string"
              ? s.image
              : (s.image as StaticImageData).src;
          const active = i === current;
          return (
            <div
              key={s.id}
              className={`${styles.heroSlide} ${active ? styles.active : ""}`}
              style={{ backgroundImage: `url(${bg})` }}
              aria-hidden={!active}
            >
              <div
                className={`${styles.heroOverlay} ${
                  s.align === "right"
                    ? styles.overlayRight
                    : s.align === "center"
                    ? styles.overlayCenter
                    : styles.overlayLeft
                }`}
              />
              <div
                className={`${styles.heroContent} ${
                  styles[`x-${s.align ?? "left"}`]
                } `}
              >
                <div className={styles.heroText}>
                  <h1 className={styles.heroTitle}>{s.title}</h1>
                  <h2 className={styles.heroSubtitle}>{s.subtitle}</h2>
                  {s.cta && (
                    <div className={styles.heroActions}>
                      <Button
                        variant="primary"
                        size="large"
                        className={styles.cta}
                      >
                        {s.cta}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className={styles.heroIndicators}>
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir al slide ${i + 1}`}
              className={`${styles.indicator} ${
                i === current ? styles.active : ""
              }`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
