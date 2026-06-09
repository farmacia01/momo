"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Syringe, Scale, Activity, type LucideIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Action {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: Action[] = [
  { label: "Registrar dose", href: "/doses", icon: Syringe },
  { label: "Pesar agora", href: "/saude", icon: Scale },
  { label: "Registrar sintoma", href: "/saude", icon: Activity },
];

export function Fab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-end gap-3 mb-2">
              {ACTIONS.map((a, i) => (
                <motion.div
                  key={a.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: (ACTIONS.length - 1 - i) * 0.05 }}
                >
                  <Link
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 group"
                  >
                    <span
                      className="rounded-full px-4 py-2 text-sm font-bold shadow-lg"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-surface-border)",
                        color: "var(--color-text)",
                      }}
                    >
                      {a.label}
                    </span>
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 shadow-lg"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid rgba(255,101,0,0.3)",
                        color: "#ff6500",
                      }}
                    >
                      <a.icon className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: open
              ? "var(--color-surface)"
              : "linear-gradient(135deg, #ff6500, #cc4c00)",
            border: open ? "1px solid #ff6500" : "none",
            boxShadow: open
              ? "0 4px 20px rgba(255,101,0,0.2)"
              : "0 4px 20px rgba(255,101,0,0.4)",
          }}
        >
          {open ? (
            <X className="h-7 w-7" style={{ color: "#ff6500" }} strokeWidth={2.5} />
          ) : (
            <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
          )}
        </motion.button>
      </div>
    </>
  );
}
