export const NOTIFICACOES = {

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 1 — DOSES
  // Timing: verificar diariamente às 8h
  // ━━━━━━━━━━━━━━━━━━━━━━
  DOSES: {

    DOSE_HOJE: (nome: string) => ({
      title: `${nome.split(' ')[0]}, hoje é dia! 💉`,
      body: 'Sua dose semanal de Mounjaro te espera. Um minuto agora vale semanas de resultado.',
      url: '/doses',
      tag: 'dose-hoje',
      desc: 'Enviado no dia da aplicação configurado pelo usuário.'
    }),

    DOSE_MANHA: (nome: string) => ({
      title: 'Bom dia! Começa bem a semana 🌿',
      body: `${nome.split(' ')[0]}, sua dose de hoje é parte do seu progresso. Não pule essa etapa.`,
      url: '/doses',
      tag: 'dose-manha',
      desc: 'Lembrete matinal no dia da dose.'
    }),

    DOSE_NOITE: (nome: string) => ({
      title: 'Ainda não aplicou hoje? 🌙',
      body: `${nome.split(' ')[0]}, o dia ainda não acabou. Registre sua dose antes de dormir.`,
      url: '/doses',
      tag: 'dose-noite',
      desc: 'Reforço noturno caso a dose não tenha sido registrada.'
    }),

    DOSE_ATRASADA_1DIA: (nome: string) => ({
      title: '⚠️ Ontem era dia da sua dose',
      body: `${nome.split(' ')[0]}, você está 1 dia atrasada. A regularidade faz toda a diferença no resultado.`,
      url: '/doses',
      tag: 'dose-atrasada',
      desc: 'Disparado 24h após o horário previsto se não houver registro.'
    }),

    DOSE_ATRASADA_VARIOS: (nome: string, dias: number) => ({
      title: `${dias} dias sem aplicar. Tudo bem? 💚`,
      body: `Sentimos sua falta, ${nome.split(' ')[0]}. Volte para o tratamento — cada dose conta.`,
      url: '/doses',
      tag: 'dose-atrasada-longa',
      desc: 'Reativação para atrasos de 3 dias ou mais.'
    }),

    PROXIMA_DOSE_AMANHA: (nome: string) => ({
      title: 'Lembrete: amanhã é dia de dose 📅',
      body: `${nome.split(' ')[0]}, prepare sua ampola. Amanhã é o grande dia da semana!`,
      url: '/doses',
      tag: 'dose-amanha',
      desc: 'Enviado às 19h do dia anterior à dose.'
    }),

    SEMANA_COMPLETA: (nome: string, semanas: number) => ({
      title: `${semanas} semanas sem falhar! 🔥`,
      body: `${nome.split(' ')[0]}, você não perdeu nenhuma dose. Essa consistência é o que transforma o corpo.`,
      url: '/doses',
      tag: 'dose-streak',
      desc: 'Comemoração de marcos de consistência.'
    }),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 2 — PROGRESSO E PESO
  // Timing: verificar semanalmente às 9h segunda-feira
  // ━━━━━━━━━━━━━━━━━━━━━━
  PROGRESSO: {

    PESAR_HOJE: (nome: string) => ({
      title: `${nome.split(' ')[0]}, hora de se pesar! ⚖️`,
      body: 'Registrar o peso hoje te mostra exatamente quanto o Mounjaro está funcionando.',
      url: '/saude',
      tag: 'peso-lembrete',
      desc: 'Segunda-feira de manhã para manter a rotina.'
    }),

    PESAR_ATRASADO: (nome: string, dias: number) => ({
      title: `Faz ${dias} dias sem registrar o peso`,
      body: `${nome.split(' ')[0]}, sem dados não dá pra saber se está indo bem. Se pese agora — leva 30 segundos.`,
      url: '/saude',
      tag: 'peso-atrasado',
      desc: 'Disparado após 10 dias sem novas pesagens.'
    }),

    PERDA_PRIMEIRA: (nome: string, perdido: number) => ({
      title: `Você perdeu os primeiros ${perdido}kg! 🎉`,
      body: `${nome.split(' ')[0]}, os primeiros quilos são sempre os mais importantes. O corpo está respondendo!`,
      url: '/saude',
      tag: 'perda-primeira',
      desc: 'Primeiro marco de perda detectado.'
    }),

    PERDA_MARCO_5: (nome: string) => ({
      title: '5kg perdidos. Isso é real! 📉',
      body: `${nome.split(' ')[0]}, 5kg a menos no seu corpo. Sente a diferença? Continue — o melhor ainda vem.`,
      url: '/saude',
      tag: 'marco-5kg',
      desc: 'Celebração de 5kg de perda acumulada.'
    }),

    PERDA_MARCO_10: (nome: string) => ({
      title: '10kg! Você está transformando sua vida 🏆',
      body: `${nome.split(' ')[0]}, 10 quilos a menos. Isso não é sorte — é resultado de consistência e coragem.`,
      url: '/saude',
      tag: 'marco-10kg',
      desc: 'Grande marco de 10kg.'
    }),

    SEMANA_SEM_PERDA: (nome: string) => ({
      title: 'O peso estabilizou essa semana 🔄',
      body: `${nome.split(' ')[0]}, platôs são normais. Continue com a dieta e a dose — o corpo está se ajustando.`,
      url: '/saude',
      tag: 'platô',
      desc: 'Mensagem de apoio caso o peso não mude em 7 dias.'
    }),

    IMC_MELHOROU: (nome: string, imc: number) => ({
      title: `Seu IMC caiu para ${imc}! 💪`,
      body: `${nome.split(' ')[0]}, cada ponto no IMC é um passo para uma vida mais saudável. Orgulho de você!`,
      url: '/saude',
      tag: 'imc-melhora',
      desc: 'Feedback positivo sobre a queda do IMC.'
    }),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 3 — ESTOQUE E COMPRAS
  // Timing: verificar diariamente às 10h
  // ━━━━━━━━━━━━━━━━━━━━━━
  ESTOQUE: {

    AMPOLA_ULTIMA: (nome: string) => ({
      title: '⚠️ Última ampola no estoque!',
      body: `${nome.split(' ')[0]}, você tem só 1 ampola. Peça a próxima agora para não interromper o tratamento.`,
      url: '/estoque',
      tag: 'ampola-ultima',
      desc: 'Urgência máxima: apenas 1 ampola restante.'
    }),

    AMPOLA_BAIXO: (nome: string, qtd: number) => ({
      title: `Restam ${qtd} ampolas. Hora de repor! 📦`,
      body: `${nome.split(' ')[0]}, não deixe faltar. Interromper o tratamento pode comprometer os resultados.`,
      url: '/estoque',
      tag: 'ampola-baixo',
      desc: 'Alerta quando o estoque chega a 2 ou 3 unidades.'
    }),

    AMPOLA_VENCENDO: (nome: string, dias: number) => ({
      title: `⚠️ Ampola vence em ${dias} dias`,
      body: `${nome.split(' ')[0]}, confira a validade da sua ampola. Use antes de vencer!`,
      url: '/estoque',
      tag: 'ampola-vencimento',
      desc: 'Alerta de validade próxima.'
    }),

    PEDIDO_DISPONIVEL: (nome: string) => ({
      title: '🏍️ Entrega disponível na sua região!',
      body: `${nome.split(' ')[0]}, há fornecedores com Mounjaro disponível perto de você. Peça hoje com entrega rápida.`,
      url: '/estoque',
      tag: 'pedido-disponivel',
      desc: 'Marketing local baseado na cidade do usuário.'
    }),

    PEDIDO_CONFIRMADO: (nome: string, codigo: string) => ({
      title: '✅ Pedido confirmado!',
      body: `${codigo} aceito pelo fornecedor. Em breve seu Mounjaro chega na sua porta, ${nome.split(' ')[0]}!`,
      url: '/meus-pedidos',
      tag: 'pedido-confirmado',
      desc: 'Evento: pedido aceito pelo fornecedor.'
    }),

    PEDIDO_CAMINHO: (nome: string) => ({
      title: '🏍️ Motoboy a caminho!',
      body: `${nome.split(' ')[0]}, seu Mounjaro está sendo entregue agora. Fique de olho!`,
      url: '/meus-pedidos',
      tag: 'pedido-caminho',
      desc: 'Evento: pedido saiu para entrega.'
    }),

    PEDIDO_ENTREGUE: (nome: string) => ({
      title: '📦 Entrega concluída!',
      body: `${nome.split(' ')[0]}, sua ampola chegou! Lembre de guardar na geladeira entre 2°C e 8°C.`,
      url: '/meus-pedidos',
      tag: 'pedido-entregue',
      desc: 'Evento: entrega realizada.'
    }),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 4 — DIETA E NUTRIÇÃO
  // Timing: terça e sexta às 12h (hora do almoço)
  // ━━━━━━━━━━━━━━━━━━━━━━
  DIETA: {

    DICA_FASE1: (nome: string) => ({
      title: '🥗 Dica para a Fase 1',
      body: `${nome.split(' ')[0]}, prefira alimentos frios e porções pequenas. Isso reduz a náusea e melhora a absorção.`,
      url: '/dieta',
      tag: 'dica-dieta',
      desc: 'Educacional para iniciantes (Dose 2.5mg).'
    }),

    DICA_FASE2: (nome: string) => ({
      title: `💪 Proteína em todo prato, ${nome.split(" ")[0]}!`,
      body: 'Na Fase 2, priorize frango, ovo e peixe em todas as refeições. Isso preserva músculo enquanto você emagrece.',
      url: '/dieta',
      tag: 'dica-dieta',
      desc: 'Educacional para Fase Intermediária (Dose 5-7.5mg).'
    }),

    DICA_FASE3: (nome: string) => ({
      title: '🔥 Fase 3: cada refeição conta!',
      body: `${nome.split(' ')[0]}, na dose máxima o corpo queima mais. Não pule refeições — coma pouco mas não jejue.`,
      url: '/dieta',
      tag: 'dica-dieta',
      desc: 'Educacional para doses altas (10mg+).'
    }),

    HIDRATACAO: (nome: string) => ({
      title: '💧 Você bebeu água hoje?',
      body: `${nome.split(' ')[0]}, 2L por dia potencializam o Mounjaro. A saciedade é maior com boa hidratação.`,
      url: '/dieta',
      tag: 'hidratacao',
      desc: 'Lembrete genérico de saúde.'
    }),

    RECEITA_NOVA: (nome: string) => ({
      title: '✨ Novas receitas geradas para você!',
      body: `${nome.split(' ')[0]}, sua IA criou receitas personalizadas para sua fase atual. Dá uma olhada!`,
      url: '/dieta',
      tag: 'receita-nova',
      desc: 'Aviso de novos conteúdos gerados.'
    }),

    REFEICAO_REGISTRAR: (nome: string) => ({
      title: 'Registrou o almoço hoje? 🍽️',
      body: `${nome.split(' ')[0]}, acompanhar o que come acelera os resultados. Leva menos de 1 minuto!`,
      url: '/dieta',
      tag: 'diario-alimentar',
      desc: 'Incentivo ao uso do diário alimentar.'
    }),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 5 — ENGAJAMENTO E RETENÇÃO
  // Timing: eventos específicos
  // ━━━━━━━━━━━━━━━━━━━━━━
  ENGAJAMENTO: {

    BEM_VINDO: (nome: string) => ({
      title: `Bem-vinda ao Momo, ${nome.split(' ')[0]}! 🌿`,
      body: 'Seu tratamento começa agora. Registre sua primeira dose e veja o progresso acontecer.',
      url: '/doses',
      tag: 'boas-vindas',
      desc: 'Enviado logo após o primeiro acesso.'
    }),

    PRIMEIRO_MES: (nome: string) => ({
      title: '1 mês de tratamento! 🎊',
      body: `${nome.split(' ')[0]}, 30 dias de comprometimento. Veja quanto você já evoluiu no seu histórico!`,
      url: '/',
      tag: 'primeiro-mes',
      desc: 'Comemoração de 30 dias de conta ativa.'
    }),

    INATIVO_3DIAS: (nome: string) => ({
      title: `${nome.split(' ')[0]}, sentimos sua falta 💚`,
      body: 'Faz 3 dias sem abrir o Momo. Seu progresso está te esperando aqui!',
      url: '/',
      tag: 'reativacao',
      desc: 'Reengajamento após 72h de inatividade.'
    }),

    INATIVO_7DIAS: (nome: string) => ({
      title: 'Tudo bem com você? 🤍',
      body: `${nome.split(' ')[0]}, uma semana sem registros. Volte quando puder — estamos aqui para te apoiar.`,
      url: '/',
      tag: 'reativacao-7d',
      desc: 'Tentativa de reativação após 1 semana.'
    }),

    COMPARTILHAR_PROGRESSO: (nome: string, perdido: number) => ({
      title: `Mostre seus ${perdido}kg perdidos! 📸`,
      body: `${nome.split(' ')[0]}, seu progresso merece ser celebrado. Compartilhe e inspire outras pessoas!`,
      url: '/saude',
      tag: 'compartilhar',
      desc: 'Incentivo ao marketing viral/comunitário.'
    }),

    TRIAL_EXPIRA_2DIAS: (nome: string) => ({
      title: '⏰ Seu trial acaba em 2 dias',
      body: `${nome.split(' ')[0]}, não perca seu progresso. Assine por R$ 29,90/mês e continue sua jornada.`,
      url: '/plano',
      tag: 'trial-urgente',
      desc: 'Conversão: trial acabando.'
    }),

    TRIAL_EXPIRA_HOJE: (nome: string) => ({
      title: '🔴 Último dia do seu trial!',
      body: `${nome.split(' ')[0]}, hoje é o último dia. Assine agora e não perca nenhum dado do seu tratamento.`,
      url: '/plano',
      tag: 'trial-hoje',
      desc: 'Conversão: último dia.'
    }),

    AVALIE_FORNECEDOR: (nome: string) => ({
      title: 'Como foi sua entrega? ⭐',
      body: `${nome.split(' ')[0]}, sua avaliação ajuda outros usuários a escolher melhor. Leva 10 segundos!`,
      url: '/meus-pedidos',
      tag: 'avaliacao',
      desc: 'Pós-venda: solicitar review.'
    }),
  },

  // ━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORIA 6 — SAÚDE E SINTOMAS
  // Timing: após registrar sintoma ou baseado no histórico
  // ━━━━━━━━━━━━━━━━━━━━━━
  SAUDE: {

    SINTOMA_NAUSEA: (nome: string) => ({
      title: 'Náusea é normal na adaptação 💚',
      body: `${nome.split(' ')[0]}, coma devagar, prefira frios e tente gengibre. O corpo está se ajustando ao Mounjaro.`,
      url: '/assistente',
      tag: 'sintoma-nausea',
      desc: 'Apoio reativo ao registrar sintoma de náusea.'
    }),

    PRESSAO_REGISTRAR: (nome: string) => ({
      title: '❤️ Já mediu a pressão esta semana?',
      body: `${nome.split(' ')[0]}, monitorar a pressão durante o tratamento é importante. Registre agora no app.`,
      url: '/saude',
      tag: 'pressao-lembrete',
      desc: 'Saúde preventiva.'
    }),

    CONSULTA_MEDICO: (nome: string) => ({
      title: '👩‍⚕️ Quando é sua próxima consulta?',
      body: `${nome.split(' ')[0]}, leve seu histórico do Momo na próxima consulta. Toque para exportar seus dados.`,
      url: '/configuracoes',
      tag: 'consulta-medico',
      desc: 'Preparação para consulta médica mensal.'
    }),
  },
};

export type NotificationTemplateKey = string;

// ━━━━━━━━━━━━━━━━━━━━━━
// TIMING RECOMENDADO (usado pelo motor e admin)
// ━━━━━━━━━━━━━━━━━━━━━━
export const TIMING_NOTIFICACOES = {
  'DOSES.DOSE_HOJE':           { hora: 8,  diasSemana: 'dia_dose_usuario', condicao: 'Dia previsto da aplicação' },
  'DOSES.DOSE_NOITE':          { hora: 20, diasSemana: 'dia_dose_usuario', condicao: 'Não registrou dose hoje' },
  'DOSES.PROXIMA_DOSE_AMANHA': { hora: 19, diasSemana: 'dia_antes_dose', condicao: 'Aviso prévio' },
  'DOSES.DOSE_ATRASADA_1DIA':  { hora: 9,  condicao: 'Atrasada há 24h' },
  'DOSES.DOSE_ATRASADA_VARIOS':{ hora: 9,  condicao: 'Atrasada há 3+ dias' },
  'PROGRESSO.PESAR_HOJE':      { hora: 8,  diasSemana: [1], condicao: 'Sem peso há 7 dias' },
  'PROGRESSO.PESAR_ATRASADO':  { hora: 10, condicao: 'Sem peso há 10+ dias' },
  'ESTOQUE.AMPOLA_BAIXO':      { hora: 10, condicao: 'Estoque < 3 ampolas' },
  'ESTOQUE.AMPOLA_ULTIMA':     { hora: 10, condicao: 'Apenas 1 ampola' },
  'DIETA.HIDRATACAO':          { hora: 14, diasSemana: [1, 3, 5], condicao: 'Frequência regular' },
  'DIETA.RECEITA_NOVA':        { hora: 12, condicao: 'Novas receitas IA disponíveis' },
  'ENGAJAMENTO.INATIVO_3DIAS': { hora: 18, condicao: 'App fechado há 72h' },
  'ENGAJAMENTO.TRIAL_EXPIRA_2DIAS': { hora: 9, condicao: 'Expira em 48h' },
  'ENGAJAMENTO.TRIAL_EXPIRA_HOJE':  { hora: 9, condicao: 'Expira nas próximas horas' },
  'SAUDE.CONSULTA_MEDICO':     { hora: 10, diasSemana: [1], condicao: 'Check-up mensal' },
};
