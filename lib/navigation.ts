import {
  LayoutDashboard,
  Syringe,
  HeartPulse,
  Salad,
  PackageOpen,
  Bot,
  Settings,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  role?: 'paciente' | 'fornecedor';
};

/**
 * Primary navigation, shared by the sidebar (desktop) and the mobile drawer.
 */
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Minhas Doses", href: "/doses", icon: Syringe, role: 'paciente' },
  { label: "Peso & Saúde", href: "/saude", icon: HeartPulse, role: 'paciente' },
  { label: "Minha Dieta", href: "/dieta", icon: Salad, role: 'paciente' },
  { label: "Estoque", href: "/estoque", icon: PackageOpen, role: 'paciente' },
  { label: "Pedidos", href: "/fornecedor/pedidos", icon: ShoppingBag, role: 'fornecedor' },
  { label: "Produtos", href: "/fornecedor/produtos", icon: Store, role: 'fornecedor' },
  { label: "Assistente IA", href: "/assistente", icon: Bot },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];
