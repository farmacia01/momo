"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Syringe,
  HeartPulse,
  Salad,
  MoreHorizontal,
  PackageOpen,
  Bot,
  Settings,
  X,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { m, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: fornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (fornecedor) {
        setRole('fornecedor');
      }
    }
    checkRole();
  }, []);

  const primaryItems: Item[] = role === 'paciente' ? [
    { label: "Home", href: "/", icon: Home },
    { label: "Doses", href: "/doses", icon: Syringe },
    { label: "Saúde", href: "/saude", icon: HeartPulse },
    { label: "Dieta", href: "/dieta", icon: Salad },
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
      { label: "Meus Pedidos", href: "/meus-pedidos", icon: ShoppingBag },
    ] : []),
  ];

  const maisActive = secondaryItems.some((s) => isActive(pathname, s.href));

  return (
    <>
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <m.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative m-4 w-full max-w-[430px] rounded-[32px] bg-card p-6 shadow-2xl z-[101]"
              style={{ marginBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Explorar</h3>
                <button onClick={() => setSheetOpen(false)} className="rounded-full bg-gray-100 p-2 text-text-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 pb-4">
                {secondaryItems.map((s) => {
                  const Icon = s.icon;
                  const active = isActive(pathname, s.href);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onMouseEnter={() => router.prefetch(s.href)}
                      onClick={() => setSheetOpen(false)}
                      className={`flex flex-col items-center gap-2 rounded-[24px] p-4 text-center transition-all ${
                        active ? "bg-primary/10" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-text-primary'}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                      <span className="text-[11px] font-bold text-text-primary">
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 h-[72px] w-full border-t border-gray-200 bg-card"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex h-full max-w-[430px] items-center justify-around">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => router.prefetch(item.href)}
                className="flex h-full w-full flex-col items-center justify-center gap-1"
              >
                <Icon className={`h-6 w-6 shrink-0 ${active ? "text-primary" : "text-text-secondary"}`} strokeWidth={2} />
                <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-text-secondary"}`}>
                    {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-1"
          >
            <MoreHorizontal className={`h-6 w-6 shrink-0 ${maisActive ? "text-primary" : "text-text-secondary"}`} strokeWidth={2} />
            <span className={`text-[10px] font-bold ${maisActive ? "text-primary" : "text-text-secondary"}`}>
                Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
