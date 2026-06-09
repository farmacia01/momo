"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "@/app/providers";
import { Moon, Sun } from "lucide-react";

export function AppHeader({
  userId,
  name,
  subtitle,
  initials,
  avatarUrl,
}: {
  userId?: string;
  name: string;
  subtitle?: string;
  initials?: string;
  avatarUrl?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const date =
    subtitle ?? format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const fallback =
    initials ?? (name.trim().slice(0, 2).toUpperCase() || "MT");

  return (
    <header className="flex items-center justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-bold tracking-tight text-text">
          Olá, {name}!
        </h1>
        <p className="mt-0.5 text-[13px] font-medium capitalize text-muted">
          {date}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
          title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {theme === "dark" ? (
            <Sun size={18} className="text-amber-500" />
          ) : (
            <Moon size={18} className="text-blue-500" />
          )}
        </button>
        <NotificationBell userId={userId} />
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-ember"
            style={{ background: "linear-gradient(135deg, var(--color-ember), var(--color-ember-dim))" }}
          >
            {fallback}
          </div>
        )}
      </div>
    </header>
  );
}
