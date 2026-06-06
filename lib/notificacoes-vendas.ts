export const PUSH_VENDAS = {
  FORNECEDOR: {
    NOVO_PEDIDO: (farmacia: string, valor: number, produto: string) => ({
      title: "🛒 Novo pedido chegou!",
      body: `${produto} · R$ ${valor.toFixed(2).replace(".", ",")} — Responda rápido para garantir a venda!`,
      url: "/fornecedor/pedidos",
      tag: "novo-pedido",
      requireInteraction: true,
    }),

    PEDIDO_AGUARDANDO: (_farmacia: string, minutos: number) => ({
      title: `⏰ Pedido aguardando há ${minutos} minutos`,
      body: "Clientes que respondem rápido têm mais avaliações positivas. Aceite ou recuse agora.",
      url: "/fornecedor/pedidos",
      tag: "pedido-aguardando",
      requireInteraction: true,
    }),

    PEDIDO_CANCELADO_CLIENTE: (codigo: string) => ({
      title: `❌ Pedido ${codigo} cancelado`,
      body: "O cliente cancelou o pedido antes da confirmação. Nenhuma ação necessária.",
      url: "/fornecedor/pedidos",
      tag: "pedido-cancelado",
    }),

    ENTREGA_CONFIRMADA: (codigo: string, valor: number) => ({
      title: `✅ Entrega confirmada! R$ ${valor.toFixed(2).replace(".", ",")}`,
      body: `Pedido ${codigo} entregue com sucesso. O valor será repassado conforme seu ciclo de pagamento.`,
      url: "/fornecedor/pedidos",
      tag: "entrega-confirmada",
    }),

    AVALIACAO_RECEBIDA: (nota: number, comentario: string) => ({
      title: nota >= 4
        ? `⭐ Você recebeu uma avaliação ${nota.toFixed(1)}!`
        : `💬 Nova avaliação recebida: ${nota.toFixed(1)} estrelas`,
      body: nota >= 4
        ? `"${comentario.substring(0, 80)}..." — Continue assim!`
        : `"${comentario.substring(0, 80)}..." — Veja e responda.`,
      url: "/fornecedor/pedidos",
      tag: "avaliacao-recebida",
    }),

    META_DIARIA_ATINGIDA: (farmacia: string, valor: number) => ({
      title: "🎯 Meta do dia atingida!",
      body: `R$ ${valor.toFixed(2).replace(".", ",")} em vendas hoje. Excelente desempenho, ${farmacia}!`,
      url: "/fornecedor",
      tag: "meta-diaria",
    }),

    PRIMEIRO_PEDIDO: (farmacia: string) => ({
      title: "🎉 Primeiro pedido do Momo!",
      body: `Parabéns ${farmacia}! Sua primeira venda pelo app chegou. Esse é o começo de algo grande!`,
      url: "/fornecedor/pedidos",
      tag: "primeiro-pedido",
    }),

    RESUMO_DIA: (pedidos: number, valor: number) => ({
      title: `📊 Resumo do dia: ${pedidos} pedido${pedidos > 1 ? "s" : ""}`,
      body: `Total: R$ ${valor.toFixed(2).replace(".", ",")} em vendas hoje. Veja o relatório completo.`,
      url: "/fornecedor",
      tag: "resumo-dia",
    }),

    ESTOQUE_PRODUTO_BAIXO: (produto: string, qtd: number) => ({
      title: `⚠️ Estoque baixo: ${produto}`,
      body: `Apenas ${qtd} unidade${qtd > 1 ? "s" : ""} disponível${qtd > 1 ? "is" : ""}. Atualize seu estoque antes de perder vendas.`,
      url: "/fornecedor/produtos",
      tag: "estoque-produto",
    }),

    PLANO_EXPIRANDO: (farmacia: string, dias: number) => ({
      title: `⏰ Seu plano expira em ${dias} dia${dias > 1 ? "s" : ""}`,
      body: `${farmacia}, renove agora para não perder sua visibilidade no marketplace do Momo.`,
      url: "/fornecedor/configuracoes",
      tag: "plano-fornecedor",
    }),
  },

  ENTREGA: {
    PEDIDO_RECEBIDO: (nome: string, codigo: string) => ({
      title: "📋 Pedido recebido!",
      body: `${nome.split(" ")[0]}, seu pedido ${codigo} foi enviado para o fornecedor. Aguardando confirmação.`,
      url: "/meus-pedidos",
      tag: "pedido-recebido",
    }),

    PEDIDO_ACEITO: (nome: string, codigo: string, tempo: string) => ({
      title: "✅ Fornecedor confirmou seu pedido!",
      body: `${nome.split(" ")[0]}, seu Mounjaro já está sendo separado. Previsão de entrega: ${tempo}.`,
      url: "/meus-pedidos",
      tag: "pedido-aceito",
    }),

    PEDIDO_RECUSADO: (nome: string, codigo: string, motivo: string) => ({
      title: `❌ Pedido ${codigo} não confirmado`,
      body: `${nome.split(" ")[0]}, motivo: ${motivo}. Tente outro fornecedor disponível na sua região.`,
      url: "/estoque",
      tag: "pedido-recusado",
    }),

    MOTOBOY_SAIU: (nome: string, tempo: string) => ({
      title: "🏍️ Motoboy saiu para entrega!",
      body: `${nome.split(" ")[0]}, seu Mounjaro está a caminho. Chegada prevista em ${tempo}. Fique por perto!`,
      url: "/meus-pedidos",
      tag: "motoboy-saiu",
    }),

    MOTOBOY_PERTO: (nome: string) => ({
      title: "📍 Motoboy chegando!",
      body: `${nome.split(" ")[0]}, o entregador está próximo. Prepare-se para receber seu pedido agora!`,
      url: "/meus-pedidos",
      tag: "motoboy-perto",
    }),

    CODIGO_CONFIRMACAO: (nome: string, codigo: string) => ({
      title: `🔐 Código de recebimento: ${codigo}`,
      body: `${nome.split(" ")[0]}, mostre este código ao motoboy para confirmar a entrega. Guarde!`,
      url: "/meus-pedidos",
      tag: "codigo-confirmacao",
      requireInteraction: true,
    }),

    ENTREGA_CONCLUIDA: (nome: string, produto: string) => ({
      title: "📦 Entrega concluída! Tudo certo?",
      body: `${nome.split(" ")[0]}, seu ${produto} chegou! Lembre: guardar na geladeira entre 2°C e 8°C.`,
      url: "/meus-pedidos",
      tag: "entrega-concluida",
    }),

    AVALIAR_ENTREGA: (nome: string) => ({
      title: "⭐ Como foi a entrega?",
      body: `${nome.split(" ")[0]}, sua avaliação leva 10 segundos e ajuda outros usuários do Momo!`,
      url: "/meus-pedidos",
      tag: "avaliar-entrega",
    }),

    COD_LEMBRETE: (nome: string, valor: number) => ({
      title: "💵 Lembre o pagamento na entrega",
      body: `${nome.split(" ")[0]}, seu pedido é Cash on Delivery. Tenha R$ ${valor.toFixed(2).replace(".", ",")} em mãos!`,
      url: "/meus-pedidos",
      tag: "cod-lembrete",
    }),

    ENTREGA_ATRASADA: (nome: string) => ({
      title: "⏰ Entrega levando mais tempo que o previsto",
      body: `${nome.split(" ")[0]}, pedimos desculpas pelo atraso. O motoboy está a caminho — aguarde mais um pouco.`,
      url: "/meus-pedidos",
      tag: "entrega-atrasada",
    }),
  },
};
