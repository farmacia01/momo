"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Package, Settings } from "lucide-react";

export function SupplierBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Painel", href: "/fornecedor", icon: LayoutDashboard },
    { label: "Pedidos", href: "/fornecedor/pedidos", icon: ClipboardList },
    { label: "Produtos", href: "/fornecedor/produtos", icon: Package },
    { label: "Config", href: "/fornecedor/configuracoes", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[rgba(255,255,255,0.07)] px-6 pt-3 pb-8 flex justify-around items-center">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              active ? "text-[#4ade80]" : "text-[rgba(255,255,255,0.28)]"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.6} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
