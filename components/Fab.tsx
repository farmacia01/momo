"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Syringe, Scale, Activity, type LucideIcon, X } from "lucide-react";
import { m, AnimatePresence  } from 'framer-motion';

interface Action {
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const ACTIONS: Action[] = [
  { label: "Registrar dose", href: "/doses", icon: Syringe, color: "text-primary" },
  { label: "Pesar agora", href: "/saude", icon: Scale, color: "text-primary" },
  { label: "Registrar sintoma", href: "/saude", icon: Activity, color: "text-primary" },
];

export function Fab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-[90px] right-5 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <div className="mb-2 flex flex-col items-end gap-3">
              {ACTIONS.map((a, i) => (
                <m.div
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
                    <span className="rounded-full bg-card px-4 py-2 text-sm font-bold text-text-primary shadow-premium">
                      {a.label}
                    </span>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-card ${a.color} shadow-premium transition-transform group-hover:scale-105`}>
                      <a.icon className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                  </Link>
                </m.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <m.button
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-shadow hover:shadow-xl"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <m.div key="x" initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0 }}>
                <X className="h-7 w-7" strokeWidth={2.5} />
              </m.div>
            ) : (
              <m.div key="plus" initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0 }}>
                <Plus className="h-7 w-7" strokeWidth={2.5} />
              </m.div>
            )}
          </AnimatePresence>
        </m.button>
      </div>
    </>
  );
}
