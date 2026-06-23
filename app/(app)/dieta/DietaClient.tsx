"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { usePlano } from "@/hooks/usePlano";
import { BlurPaywall } from "@/components/BlurPaywall";
import { faseFromDose } from "@/lib/diet-plans";
import { DashboardTab } from "@/components/dieta/DashboardTab";
import { ReceitasTab } from "@/components/dieta/ReceitasTab";
import { RegistrarRefeicaoModal } from "@/components/dieta/RegistrarRefeicaoModal";
import {
  type Refeicao,
  type FavoritoRefeicao,
  getFavoritos,
  saveFavoritos,
} from "@/components/dieta/types";

type Tab = "Dashboard" | "Receitas";

export function DietaClient({
  userId,
  doseMg,
  refeicoesIniciais,
}: {
  userId: string;
  doseMg: number;
  refeicoesIniciais: any[];
}) {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(
    refeicoesIniciais.map((r: any) => ({
      id: r.id,
      nome: r.descricao || r.nome,
      calorias: r.calorias_estimadas || r.calorias || 0,
      proteinas: r.proteinas_g || r.proteinas || 0,
      carboidratos: r.carboidratos_g || r.carboidratos || 0,
      gorduras: r.gorduras_g || r.gorduras || 0,
      criado_em: r.data || r.criado_em,
      tipo: r.tipo,
    }))
  );
  const [registering, setRegistering] = useState(false);
  const [favoritos, setFavoritos] = useState<FavoritoRefeicao[]>([]);

  const { isExpirado } = usePlano();
  const fase = faseFromDose(doseMg);

  useEffect(() => { setFavoritos(getFavoritos()); }, []);

  function hojeEmBrasilia() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  }

  const [hoje, setHoje] = useState(hojeEmBrasilia);

  // Atualiza "hoje" quando o dia virar (checa a cada minuto)
  useEffect(() => {
    const id = setInterval(() => {
      const atual = hojeEmBrasilia();
      setHoje((prev) => (prev !== atual ? atual : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  function toggleFavorito(r: Refeicao) {
    const fav: FavoritoRefeicao = {
      nome: r.nome,
      calorias: r.calorias,
      proteinas: r.proteinas,
      carboidratos: r.carboidratos,
      gorduras: r.gorduras,
      tipo: r.tipo || "almoco",
    };
    setFavoritos((prev) => {
      const exists = prev.find((f) => f.nome === r.nome);
      const next = exists ? prev.filter((f) => f.nome !== r.nome) : [fav, ...prev];
      saveFavoritos(next);
      toast.success(exists ? "Removido dos favoritos" : "Salvo nos favoritos ⭐");
      return next.slice(0, 10);
    });
  }

  async function removerRefeicao(id: string) {
    const { error } = await supabase.from("refeicoes_registradas").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover.");
    } else {
      setRefeicoes((prev) => prev.filter((r) => r.id !== id));
      toast.success("Removida.");
    }
  }

  function onRefeicaoSalva(r: any) {
    setRefeicoes((prev) => [
      {
        id: r.id,
        nome: r.descricao,
        calorias: r.calorias_estimadas,
        proteinas: r.proteinas_g,
        carboidratos: r.carboidratos_g,
        gorduras: r.gorduras_g,
        criado_em: r.data,
        tipo: r.tipo,
      },
      ...prev,
    ]);
    setRegistering(false);
  }

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Minha Dieta" showBack={false} />

      <BlurPaywall ativo={isExpirado} mensagem="Acompanhe sua dieta no plano Premium">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-mid rounded-2xl">
          {(["Dashboard", "Receitas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                tab === t ? "bg-ember text-white shadow-ember" : "text-muted"
              }`}
            >
              {t === "Dashboard" ? "Resumo" : "Receitas"}
            </button>
          ))}
        </div>

        <div className="animate-fade-up mt-6">
          {tab === "Dashboard" ? (
            <DashboardTab
              fase={fase}
              refeicoes={refeicoes}
              hoje={hoje}
              favoritos={favoritos}
              onRegistrar={() => setRegistering(true)}
              onToggleFavorito={toggleFavorito}
              onRemoverRefeicao={removerRefeicao}
            />
          ) : (
            <ReceitasTab userId={userId} fase={fase} doseMg={doseMg} />
          )}
        </div>
      </BlurPaywall>

      {registering && (
        <RegistrarRefeicaoModal
          userId={userId}
          favoritos={favoritos}
          onClose={() => setRegistering(false)}
          onSuccess={onRefeicaoSalva}
        />
      )}
    </div>
  );
}
