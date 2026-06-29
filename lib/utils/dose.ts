import { addDays, differenceInDays, isToday, isTomorrow, isPast, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Parse a YYYY-MM-DD date string as local midnight (avoids UTC-offset shifting). */
export function parseDateStr(dateStr: string): Date {
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export interface CalculoDose {
  data: Date;
  dataFormatada: string;
  diasRestantes: number;
  isAtrasado: boolean;
  isHoje: boolean;
  isAmanha: boolean;
  diasAtraso: number;
}

export interface TextosDose {
  principal: string;
  secundario: string;
  cor: 'red' | 'green' | 'yellow' | 'default';
  badge: string | null;
}

export function calcularProximaDose(ultimaDoseISO: string | null | undefined, inicioTratamentoISO: string | null | undefined): CalculoDose {
  // Fallback: se não tem nenhuma dose registrada, usa a data de início do tratamento
  const dataBase = ultimaDoseISO
    ? parseDateStr(ultimaDoseISO)
    : inicioTratamentoISO
      ? parseDateStr(inicioTratamentoISO)
      : new Date()

  // Próxima dose = data base + 7 dias
  const proximaDose = addDays(dataBase, 7)
  const hoje = new Date()
  const diasRestantes = differenceInDays(proximaDose, hoje)

  return {
    data: proximaDose,
    dataFormatada: format(proximaDose, "dd 'de' MMMM", { locale: ptBR }),
    diasRestantes,
    isAtrasado: isPast(proximaDose) && !isToday(proximaDose),
    isHoje: isToday(proximaDose),
    isAmanha: isTomorrow(proximaDose),
    diasAtraso: isPast(proximaDose) && !isToday(proximaDose) ? Math.abs(diasRestantes) : 0
  }
}

export function getTextoProximaDose(calculo: CalculoDose): TextosDose {
  if (calculo.isAtrasado) {
    return {
      principal: `${calculo.diasAtraso}d atrasado`,
      secundario: calculo.dataFormatada,
      cor: 'red',
      badge: `ATRASADO`
    }
  }
  if (calculo.isHoje) {
    return {
      principal: 'Hoje!',
      secundario: 'Aplique agora',
      cor: 'green',
      badge: 'HOJE'
    }
  }
  if (calculo.isAmanha) {
    return {
      principal: 'Amanhã',
      secundario: calculo.dataFormatada,
      cor: 'yellow',
      badge: 'AMANHÃ'
    }
  }
  return {
    principal: `Em ${calculo.diasRestantes} dias`,
    secundario: calculo.dataFormatada,
    cor: 'default',
    badge: null
  }
}
