"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Package, ShoppingBag, Settings, Store } from "lucide-react";

interface FornecedorShellProps {
  children: React.ReactNode;
  fornecedorNome?: string;
  status?: string;
}

export function FornecedorShell({ children, fornecedorNome, status }: FornecedorShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isCadastroOrAguardando = pathname === '/fornecedor/cadastro' || pathname === '/fornecedor/aguardando';

  if (isCadastroOrAguardando) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  const getStatusBadge = () => {
    if (status === 'ativo') return <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider">Ativo</span>;
    if (status === 'pendente') return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">Pendente</span>;
    return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">Suspenso</span>;
  };

  const navItems = [
    { label: "Dashboard", href: "/fornecedor", icon: LayoutDashboard },
    { label: "Pedidos", href: "/fornecedor/pedidos", icon: ShoppingBag },
    { label: "Produtos", href: "/fornecedor/produtos", icon: Package },
    { label: "Configurações", href: "/fornecedor/configuracoes", icon: Settings },
  ];

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2 mb-1">
          <Store className="h-6 w-6 text-forest" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">Momo</p>
          </div>
        </div>
        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-forest text-white text-[10px] font-bold uppercase tracking-wider">
          Painel Fornecedor
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-surface-mid text-forest"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-forest" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-200 px-4 py-3">
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 -ml-2 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">{fornecedorNome || 'Carregando...'}</h1>
              {getStatusBadge()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}