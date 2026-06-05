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
  { label: "Registrar dose", href: "/doses", icon: Syringe, color: "text-[#16a34a]" },
  { label: "Pesar agora", href: "/saude", icon: Scale, color: "text-[#16a34a]" },
  { label: "Registrar sintoma", href: "/saude", icon: Activity, color: "text-[#16a34a]" },
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
            className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <div className="flex flex-col items-end gap-3 mb-2">
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
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-premium">
                      {a.label}
                    </span>
                    <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-white ${a.color} shadow-premium transition-transform group-hover:scale-105`}>
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1c4d2e] text-white shadow-lg shadow-[#1c4d2e]/30 transition-shadow hover:shadow-xl"
        >
          {open ? (
            <X className="h-7 w-7" strokeWidth={2.5} />
          ) : (
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          )}
        </m.button>
      </div>
    </>
  );
}
