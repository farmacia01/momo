import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Momo e acompanhe seu tratamento com Mounjaro.",
  alternates: { canonical: "https://momo-rust-nu.vercel.app/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
