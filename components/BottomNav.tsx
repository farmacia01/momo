"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { motion, AnimatePresence } from "framer-motion";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [role, setRole] = useState<'paciente' | 'fornecedor'>('paciente');
  const [pendingOrders, setPendingOrders] = useState(0);

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative m-4 w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl z-[101]"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Explorar</h3>
                <button onClick={() => setSheetOpen(false)} className="rounded-full bg-gray-50 p-2 text-gray-400">
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
                      onClick={() => setSheetOpen(false)}
                      className={`flex flex-col items-center gap-2 rounded-[24px] p-4 text-center transition-all ${
                        active ? "bg-surface" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-mid text-forest">
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                      <span className="text-[11px] font-bold text-gray-900">
                        {s.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] w-full max-w-[340px] px-2 pointer-events-none">
        <div className="flex w-full items-center justify-around gap-1 rounded-full bg-gray-900/95 backdrop-blur-md p-1.5 shadow-2xl pointer-events-auto">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full transition-all duration-300 ${
                  active ? "bg-[#1c4d2e] px-4 py-2 shadow-lg shadow-[#1c4d2e]/20" : "p-3 hover:bg-white/5"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-white/40"}`} strokeWidth={2.5} />
                {active && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[11px] font-bold text-white whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}

          <button
            onClick={() => setSheetOpen(true)}
            className={`flex items-center gap-2 rounded-full transition-all duration-300 ${
              maisActive ? "bg-[#1c4d2e] px-4 py-2 shadow-lg shadow-[#1c4d2e]/20" : "p-3 hover:bg-white/5"
            }`}
          >
            <MoreHorizontal className={`h-5 w-5 shrink-0 ${maisActive ? "text-white" : "text-white/40"}`} strokeWidth={2.5} />
            {maisActive && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-bold text-white whitespace-nowrap"
              >
                Mais
              </motion.span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
