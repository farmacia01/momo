import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Crie sua conta no Momo e comece a acompanhar suas doses, peso e dieta com Mounjaro.",
  alternates: { canonical: "https://momo-rust-nu.vercel.app/cadastro" },
};

export default function CadastroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
