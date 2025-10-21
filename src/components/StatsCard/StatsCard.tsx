"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import styles from "./StatsCard.module.scss"

interface StatsCardProps {
  icon: ReactNode
  title: string
  value: string | number
  gradient: string
  delay?: number
}

export default function StatsCard({ icon, title, value, gradient, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      className={styles.statCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className={styles.statIcon} style={{ background: gradient }}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <h3>{title}</h3>
        <p className={styles.statValue}>{value}</p>
      </div>
      <div className={styles.glow} style={{ background: gradient }}></div>
    </motion.div>
  )
}
