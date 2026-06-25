"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Syringe,
  HeartPulse,
  MoreHorizontal,
  PackageOpen,
  Bot,
  Settings,
  X,
  ShoppingBag,
  Store,
  Salad,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { m, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/providers";
import { ThemeToggle } from "./ThemeToggle";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
  role?: 'paciente' | 'fornecedor';
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<'paciente' | 'fornecedor'>('paciente');
  const [pendingOrders, setPendingOrders] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: fornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fornecedor) {
        setRole('fornecedor');
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('fornecedor_id', fornecedor.id)
          .eq('status', 'novo');

        setPendingOrders(count || 0);

        const channel = supabase
          .channel('nav-orders')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `fornecedor_id=eq.${fornecedor.id}` },
          () => setPendingOrders(prev => prev + 1))
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    }
    checkRole();
  }, []);

  const primaryItems: Item[] = role === 'paciente' ? [
    { label: "Home", href: "/", icon: Home },
    { label: "Doses", href: "/doses", icon: Syringe },
    { label: "Dieta", href: "/dieta", icon: Salad },
    { label: "Saúde", href: "/saude", icon: HeartPulse },
  ] : [
    { label: "Home", href: "/", icon: Home },
    { label: "Pedidos", href: "/fornecedor/pedidos", icon: ShoppingBag },
    { label: "Produtos", href: "/fornecedor/produtos", icon: Store },
    { label: "Estoque", href: "/estoque", icon: PackageOpen },
  ];

  const secondaryItems: Item[] = [
    { label: "Assistente IA", href: "/assistente", icon: Bot },
    { label: "Configurações", href: "/configuracoes", icon: Settings },
    ...(role === 'paciente' ? [
      { label: "Estoque", href: "/estoque", icon: PackageOpen },
    ] : []),
  ];

  const maisActive = secondaryItems.some((s) => isActive(pathname, s.href));

  const inactiveIconColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.35)";
  const navPillBg = isDark ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.97)";
  const navPillBorder = isDark ? "#2d2d2d" : "#e2e8f0";
  const navPillShadow = isDark
    ? "0 4px 24px rgba(0,0,0,0.5)"
    : "0 4px 24px rgba(0,0,0,0.08)";

  return (
    <>
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: "var(--z-modal)" }}>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
              style={{ zIndex: "var(--z-overlay)" }}
            />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative m-4 w-full max-w-md rounded-[32px] p-6 shadow-2xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-surface-border)",
                zIndex: "var(--z-modal)",
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                  Explorar
                </h3>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="rounded-full p-2 transition-colors"
                  style={{
                    background: "var(--color-surface-mid)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pb-4">
                {secondaryItems.map((s) => {
                  const Icon = s.icon;
                  const active = isActive(pathname, s.href);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onMouseEnter={() => router.prefetch(s.href)}
                      onClick={() => setSheetOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-[24px] p-4 text-center transition-all"
                      style={{
                        background: active ? "rgba(255,101,0,0.12)" : "var(--color-surface-mid)",
                        border: active
                          ? "1px solid rgba(255,101,0,0.25)"
                          : "1px solid var(--color-surface-border)",
                      }}
                    >
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          background: active ? "rgba(255,101,0,0.2)" : "var(--color-surface-border)",
                          color: active ? "#ff6500" : "var(--color-text-muted)",
                        }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: active ? "#ff6500" : "var(--color-text)" }}
                      >
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <ThemeToggle />
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pointer-events-none"
        style={{
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          background: "linear-gradient(to top, var(--color-bg) 80%, transparent)",
          zIndex: "var(--z-nav)",
        }}
      >
        <div
          className="mx-auto flex w-full max-w-[340px] items-center justify-around gap-1 rounded-full p-1.5 pointer-events-auto"
          style={{
            background: navPillBg,
            backdropFilter: "blur(20px)",
            border: `1px solid ${navPillBorder}`,
            boxShadow: navPillShadow,
          }}
        >
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => router.prefetch(item.href)}
                className="flex items-center gap-2 rounded-full transition-all duration-300"
                style={
                  active
                    ? {
                        background: "#ff6500",
                        padding: "8px 16px",
                        boxShadow: "0 4px 16px rgba(255,101,0,0.35)",
                      }
                    : { padding: "12px" }
                }
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={2.5}
                  style={{ color: active ? "#ffffff" : inactiveIconColor }}
                />
                {active && (
                  <m.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[11px] font-bold text-white whitespace-nowrap"
                  >
                    {item.label}
                  </m.span>
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-full transition-all duration-300"
            style={
              maisActive
                ? {
                    background: "#ff6500",
                    padding: "8px 16px",
                    boxShadow: "0 4px 16px rgba(255,101,0,0.35)",
                  }
                : { padding: "12px" }
            }
          >
            <MoreHorizontal
              className="h-5 w-5 shrink-0"
              strokeWidth={2.5}
              style={{ color: maisActive ? "#ffffff" : inactiveIconColor }}
            />
            {maisActive && (
              <m.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-bold text-white whitespace-nowrap"
              >
                Mais
              </m.span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
