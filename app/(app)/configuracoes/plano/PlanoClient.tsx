"use client";

import { PageHeader } from "@/components/PageHeader";
import { Star, ExternalLink, Calendar, CreditCard, Lock, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanoClientProps {
  planoAtivo: string;
  assinatura: any;
  checkoutUrl: string;
}

export function PlanoClient({ planoAtivo, assinatura, checkoutUrl }: PlanoClientProps) {
  const isPremium = planoAtivo === 'premium' && assinatura?.status === 'ativa';

  return (
    <div className="space-y-6 pb-32">
      <PageHeader title="Meu Plano" />

      {isPremium ? (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-[#1c4d2e] to-[#2d7a4f] rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 rounded-full bg-surface/10 blur-2xl" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-surface/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Star size={24} className="text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Momo Premium</h2>
                <p className="text-sm font-medium text-white/80">Assinatura {assinatura.plano}</p>
              </div>
            </div>

            <div className="space-y-4 bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <CreditCard size={16} />
                  <span>Status</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-green-300">
                  Ativa
                </span>
              </div>
              
              {assinatura.proximo_vencimento && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar size={16} />
                    <span>Próxima renovação</span>
                  </div>
                  <span className="text-sm font-bold">
                    {format(parseISO(assinatura.proximo_vencimento), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              {assinatura.valor && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Star size={16} />
                    <span>Valor</span>
                  </div>
                  <span className="text-sm font-bold">
                    R$ {assinatura.valor.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <a 
            href="#" // TODO: Substituir pelo link do portal do cliente Cakto se disponível
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-surface text-text border border-slate-200 py-4 rounded-full font-bold shadow-sm active:scale-[0.98] transition-all"
          >
            <ExternalLink size={18} />
            Gerenciar Assinatura na Cakto
          </a>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-surface rounded-[24px] p-6 shadow-premium border border-surface-border text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-surface-mid rounded-full flex items-center justify-center mx-auto mb-4 text-dim">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Plano Gratuito</h2>
            <p className="text-sm text-muted mb-6 px-4">
              Você está no plano básico. Faça o upgrade para desbloquear todas as funcionalidades do Momo.
            </p>

            <div className="text-left space-y-3 mb-8 bg-surface-mid rounded-[20px] p-5">
              <h3 className="text-xs font-bold text-dim uppercase tracking-widest mb-4">O que inclui no Premium:</h3>
              {[
                "Métricas avançadas e gráficos",
                "Receitas ilimitadas com IA",
                "Suporte prioritário",
                "Histórico completo de sintomas",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-ember shrink-0" />
                  <span className="text-sm font-medium text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <a 
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-forest to-[#2d7a4f] text-white py-4 rounded-full font-bold shadow-lg shadow-forest/20 active:scale-[0.98] transition-all"
            >
              <Star size={18} className="fill-white" />
              Assinar Momo Premium
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
