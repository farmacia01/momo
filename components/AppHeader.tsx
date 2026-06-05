"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

interface AppHeaderProps {
  userId: string;
}

const getTitleForPath = (path: string) => {
    if (path === '/') return "Dashboard";
    if (path.startsWith('/doses')) return "Minhas Doses";
    if (path.startsWith('/saude')) return "Minha Saúde";
    if (path.startsWith('/dieta')) return "Minha Dieta";
    if (path.startsWith('/estoque')) return "Meu Estoque";
    if (path.startsWith('/meus-pedidos')) return "Meus Pedidos";
    if (path.startsWith('/configuracoes')) return "Configurações";
    if (path.startsWith('/assistente')) return "Assistente IA";
    return "Monjaro";
}

export function AppHeader({ userId }: AppHeaderProps) {
  const pathname = usePathname();
  const title = getTitleForPath(pathname);

  return (
    <header 
      className="sticky top-0 z-30 grid h-[60px] grid-cols-3 items-center gap-4 border-b border-gray-200/80 bg-card/80 px-4 backdrop-blur-sm"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex-1 justify-self-start">
        {/* Intentionally left blank for alignment */}
      </div>
      <div className="justify-self-center">
        <h1 className="text-lg font-bold text-text-primary whitespace-nowrap">{title}</h1>
      </div>
      <div className="flex items-center gap-3 justify-self-end">
        <NotificationBell userId={userId} />
      </div>
    </header>
  );
}
