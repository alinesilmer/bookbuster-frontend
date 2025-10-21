import type { ReactNode } from "react";
import Navbar from "@/components/Navbar/Navbar";
import styles from "./Layout.module.scss";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
