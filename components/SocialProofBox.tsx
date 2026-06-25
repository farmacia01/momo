"use client";

import React from 'react';
import { Star, Users, TrendingDown, AlertCircle } from 'lucide-react';

interface SocialProofBoxProps {
  type?: 'trust' | 'urgency' | 'objection' | 'waiting';
  className?: string;
}

export function SocialProofBox({ type = 'trust', className = '' }: SocialProofBoxProps) {
  if (type === 'trust') {
    return (
      <div className={`rounded-2xl p-5 space-y-4 ${className}`} style={{ background: 'rgba(255, 101, 0, 0.05)', border: '1px solid rgba(255, 101, 0, 0.15)' }}>
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 mt-0.5" style={{ color: '#ff6500' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#111' }}>
              2.340 mulheres acompanhando sua jornada com Monjaro
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(17, 17, 17, 0.6)' }}>
              Histórico, progresso, comunidade e suporte em um só lugar
            </p>
          </div>
        </div>

        <div className="space-y-2 pl-8">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 mt-0.5" style={{ color: '#ff6500' }} />
            <p className="text-xs" style={{ color: '#111' }}>
              <span className="font-bold">Carla:</span> -2,4kg em 2 semanas (acompanhando as doses)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 mt-0.5" style={{ color: '#ff6500' }} />
            <p className="text-xs" style={{ color: '#111' }}>
              <span className="font-bold">Paula:</span> -1,8kg em 3 semanas (com lembretes e histórico)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 mt-0.5" style={{ color: '#ff6500' }} />
            <p className="text-xs" style={{ color: '#111' }}>
              <span className="font-bold">Marina:</span> -3,1kg em 4 semanas (conectada à comunidade)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-8">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3" fill="#ff6500" style={{ color: '#ff6500' }} />
            ))}
          </div>
          <p className="text-xs font-bold" style={{ color: '#ff6500' }}>
            Comunidade de mulheres com Monjaro
          </p>
        </div>
      </div>
    );
  }

  if (type === 'urgency') {
    return (
      <div className={`rounded-2xl p-5 space-y-3 ${className}`} style={{ background: 'rgba(255, 193, 7, 0.08)', border: '1px solid rgba(255, 193, 7, 0.25)' }}>
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'rgba(255, 193, 7, 0.8)' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: '#111' }}>
              Primeiras 2-3 semanas com Monjaro definem seu resultado
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(17, 17, 17, 0.6)' }}>
              Acompanhamento consistente, histórico de doses e suporte agora = transformação real depois. Cada dia conta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'objection') {
    return (
      <div className={`rounded-2xl p-5 space-y-3 ${className}`} style={{ background: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
        <p className="text-sm font-bold" style={{ color: '#111' }}>
          Tudo o que você precisa para sua jornada:
        </p>
        <div className="space-y-2 pl-6">
          <div className="flex items-start gap-2">
            <span style={{ color: '#4CAF50' }} className="text-sm font-bold">✓</span>
            <p className="text-xs" style={{ color: '#111' }}>
              Histórico de doses e progresso (gráficos em tempo real)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#4CAF50' }} className="text-sm font-bold">✓</span>
            <p className="text-xs" style={{ color: '#111' }}>
              Lembretes e comunidade (5.234 mulheres se ajudando)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#4CAF50' }} className="text-sm font-bold">✓</span>
            <p className="text-xs" style={{ color: '#111' }}>
              7 dias grátis, sem cartão de crédito
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#4CAF50' }} className="text-sm font-bold">✓</span>
            <p className="text-xs" style={{ color: '#111' }}>
              Cancela quando quiser, sem justificativa
            </p>
          </div>
        </div>
        <p className="text-xs italic" style={{ color: 'rgba(17, 17, 17, 0.5)' }}>
          Você não está sozinha. Próximo passo: criar conta.
        </p>
      </div>
    );
  }

  if (type === 'waiting') {
    return (
      <div className={`rounded-2xl p-5 space-y-3 ${className}`} style={{ background: 'rgba(255, 101, 0, 0.05)', border: '1px solid rgba(255, 101, 0, 0.15)' }}>
        <p className="text-sm font-bold" style={{ color: '#111' }}>
          Enquanto isso...
        </p>
        <p className="text-xs" style={{ color: 'rgba(17, 17, 17, 0.6)' }}>
          5.234 mulheres estão acompanhando suas doses, compartilhando progresso e se apoiando mutuamente. Você vai se juntar em breve! 🎉
        </p>
      </div>
    );
  }

  return null;
}
