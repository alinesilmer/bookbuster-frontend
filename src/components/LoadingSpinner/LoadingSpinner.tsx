"use client"

import { motion } from "framer-motion"
import styles from "./LoadingSpinner.module.scss"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  text?: string
}

export default function LoadingSpinner({ size = "medium", text }: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <motion.div
        className={`${styles.spinner} ${styles[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <div className={styles.circle}></div>
      </motion.div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )
}
