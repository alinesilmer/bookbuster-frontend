"use client";

import "@/styles/globals.scss";
import WhatsAppFloat from "@/components/WhatsAppFloat/WhatsAppFloat";
import type { AppProps } from "next/app";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Component {...pageProps} key={router.pathname} />
      </AnimatePresence>
      <WhatsAppFloat />
    </>
  );
}
