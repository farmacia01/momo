/**
 * Predefined Mounjaro diet plans and model meals.
 *
 * These are static, evidence-informed templates keyed by treatment phase. The
 * user's active plan is derived from their current dose/weeks (`getFase`).
 * Nothing here is medical advice — copy reflects general guidance for people on
 * tirzepatide and is shown alongside the "consulte seu médico" disclaimer.
 */

export type FaseMounjaro = 1 | 2 | 3;

export type TipoRefeicao = "cafe" | "almoco" | "jantar" | "lanche";

export const TIPO_REFEICAO_LABEL: Record<TipoRefeicao, string> = {
  cafe: "Café da manhã",
  almoco: "Almoço",
  jantar: "Jantar",
  lanche: "Lanche",
};

export interface Macros {
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
}

export interface RefeicaoModelo {
  tipo: TipoRefeicao;
  nome: string;
  descricao: string;
  calorias: number;
}

export interface PlanoFase {
  fase: FaseMounjaro;
  nome: string;
  faixaDose: string;
  foco: string;
  resumo: string;
  caloriasMin: number;
  caloriasMax: number;
  /** Daily macro targets in grams (basis for the macro table + ring goal). */
  macros: Macros;
  alimentosRecomendados: string[];
  alimentosEvitar: string[];
  refeicoesModelo: RefeicaoModelo[];
}

/** kcal contribution of each macronutrient (4/4/9). */
export const KCAL = { proteina: 4, carbo: 4, gordura: 9 } as const;

export function macroKcal(m: Macros) {
  return {
    proteina: m.proteina_g * KCAL.proteina,
    carbo: m.carbo_g * KCAL.carbo,
    gordura: m.gordura_g * KCAL.gordura,
  };
}

export function macroTotalKcal(m: Macros) {
  const k = macroKcal(m);
  return k.proteina + k.carbo + k.gordura;
}

/** Percentage of total calories for each macro (rounded, sums to ~100). */
export function macroPercent(m: Macros) {
  const k = macroKcal(m);
  const total = k.proteina + k.carbo + k.gordura || 1;
  return {
    proteina: Math.round((k.proteina / total) * 100),
    carbo: Math.round((k.carbo / total) * 100),
    gordura: Math.round((k.gordura / total) * 100),
  };
}

/** Maps the number of completed weeks (or current dose) to a treatment phase. */
export function getFase(weeksCompleted: number | null, doseMg: number = 2.5): FaseMounjaro {
  if (weeksCompleted !== null) {
    if (weeksCompleted < 8) return 1;
    if (weeksCompleted < 16) return 2;
    return 3;
  }
  if (doseMg <= 5) return 1;
  if (doseMg <= 10) return 2;
  return 3;
}

export const PLANOS: Record<FaseMounjaro, PlanoFase> = {
  1: {
    fase: 1,
    nome: "Adaptação",
    faixaDose: "2,5 mg – 5 mg",
    foco: "Tolerância ao medicamento e foco em proteína",
    resumo:
      "Fase inicial. O corpo está se adaptando — priorize refeições menores e mais frequentes, ricas em proteína, e evite gatilhos comuns de náusea (frituras, gordura em excesso, doces).",
    caloriasMin: 1600,
    caloriasMax: 1800,
    macros: { proteina_g: 120, carbo_g: 170, gordura_g: 60 },
    alimentosRecomendados: [
      "Ovos e claras",
      "Frango e peixe grelhados",
      "Iogurte natural e queijos magros",
      "Arroz, aveia e pães integrais",
      "Frutas de baixa acidez (banana, maçã, pera)",
      "Legumes cozidos e sopas leves",
      "Gengibre (ajuda na náusea)",
    ],
    alimentosEvitar: [
      "Frituras e alimentos muito gordurosos",
      "Doces e refrigerantes",
      "Comidas muito condimentadas",
      "Álcool",
      "Porções grandes de uma só vez",
      "Cafeína em excesso com o estômago vazio",
    ],
    refeicoesModelo: [
      {
        tipo: "cafe",
        nome: "Omelete leve",
        descricao: "2 ovos mexidos, 1 fatia de pão integral e chá de gengibre.",
        calorias: 320,
      },
      {
        tipo: "lanche",
        nome: "Iogurte com fruta",
        descricao: "Iogurte natural com banana e 1 col. de aveia.",
        calorias: 180,
      },
      {
        tipo: "almoco",
        nome: "Frango grelhado",
        descricao: "Filé de frango, arroz integral e legumes no vapor.",
        calorias: 480,
      },
      {
        tipo: "jantar",
        nome: "Sopa proteica",
        descricao: "Sopa de legumes com frango desfiado e azeite.",
        calorias: 380,
      },
    ],
  },
  2: {
    fase: 2,
    nome: "Consolidação",
    faixaDose: "7,5 mg – 10 mg",
    foco: "Déficit calórico moderado e composição corporal",
    resumo:
      "Dose terapêutica estabelecida. Mantenha um déficit calórico moderado (1400–1600 kcal), proteína alta para preservar massa magra e bastante fibra para saciedade.",
    caloriasMin: 1400,
    caloriasMax: 1600,
    macros: { proteina_g: 130, carbo_g: 130, gordura_g: 50 },
    alimentosRecomendados: [
      "Carnes magras (frango, peixe, patinho)",
      "Ovos",
      "Leguminosas (feijão, lentilha, grão-de-bico)",
      "Vegetais folhosos e crucíferos",
      "Frutas inteiras com casca",
      "Grãos integrais em porções controladas",
      "Gorduras boas (azeite, abacate, castanhas)",
    ],
    alimentosEvitar: [
      "Ultraprocessados e fast-food",
      "Bebidas açucaradas e sucos industrializados",
      "Massas e pães brancos em excesso",
      "Doces e sobremesas calóricas",
      "Molhos cremosos e frituras",
    ],
    refeicoesModelo: [
      {
        tipo: "cafe",
        nome: "Ovos + abacate",
        descricao: "2 ovos, 1/4 de abacate e café sem açúcar.",
        calorias: 300,
      },
      {
        tipo: "lanche",
        nome: "Mix proteico",
        descricao: "Iogurte grego com castanhas (porção pequena).",
        calorias: 170,
      },
      {
        tipo: "almoco",
        nome: "Prato equilibrado",
        descricao: "Peixe grelhado, salada verde, feijão e 3 col. de arroz.",
        calorias: 520,
      },
      {
        tipo: "jantar",
        nome: "Omelete de legumes",
        descricao: "Omelete com espinafre e tomate + salada.",
        calorias: 360,
      },
    ],
  },
  3: {
    fase: 3,
    nome: "Manutenção e maximização",
    faixaDose: "12,5 mg – 15 mg",
    foco: "Alta proteína e preservação de massa magra",
    resumo:
      "Dose máxima. Apetite bastante reduzido — garanta proteína suficiente em cada refeição (mesmo com fome baixa), 1200–1400 kcal, e priorize alimentos nutricionalmente densos.",
    caloriasMin: 1200,
    caloriasMax: 1400,
    macros: { proteina_g: 130, carbo_g: 95, gordura_g: 45 },
    alimentosRecomendados: [
      "Proteínas magras em toda refeição",
      "Whey/proteína em pó (se a fome estiver baixa)",
      "Ovos e laticínios magros",
      "Peixes ricos em ômega-3",
      "Vegetais variados e coloridos",
      "Pequenas porções de carboidrato integral",
      "Água e eletrólitos",
    ],
    alimentosEvitar: [
      "Calorias líquidas vazias",
      "Açúcar e doces",
      "Frituras",
      "Porções grandes (preferir densidade nutricional)",
      "Álcool",
    ],
    refeicoesModelo: [
      {
        tipo: "cafe",
        nome: "Shake proteico",
        descricao: "Whey, leite desnatado e 1/2 banana.",
        calorias: 250,
      },
      {
        tipo: "lanche",
        nome: "Queijo + fruta",
        descricao: "Queijo cottage com morangos.",
        calorias: 150,
      },
      {
        tipo: "almoco",
        nome: "Bowl proteico",
        descricao: "Frango desfiado, quinoa e legumes grelhados.",
        calorias: 450,
      },
      {
        tipo: "jantar",
        nome: "Peixe + vegetais",
        descricao: "Salmão assado com aspargos e purê de couve-flor.",
        calorias: 400,
      },
    ],
  },
};

/** High glycemic-index / trigger ingredients used to flag risky diary entries. */
export const ALIMENTOS_ALTO_IG = [
  "refrigerante",
  "suco de caixinha",
  "suco industrializado",
  "açúcar",
  "acucar",
  "pão branco",
  "pao branco",
  "arroz branco",
  "batata frita",
  "batata",
  "purê",
  "pure",
  "doce",
  "bolo",
  "sorvete",
  "bala",
  "chocolate",
  "mel",
  "pizza",
  "macarrão",
  "macarrao",
  "biscoito",
  "bolacha",
  "cerveja",
  "fritura",
  "frito",
];

export const LIMITE_CALORIAS_REFEICAO = 700;

export interface AnaliseRefeicao {
  altaCaloria: boolean;
  altoIG: boolean;
  gatilhos: string[];
}

export const SUBSTITUICOES_IG: Record<string, string> = {
  'arroz branco':     'arroz integral',
  'pão branco':       'pão integral ou wrap integral',
  'batata':           'batata-doce',
  'macarrão':         'macarrão integral ou de grão-de-bico',
  'refrigerante':     'água com gás + limão',
  'suco de fruta':    'fruta inteira',
  'farinha de trigo': 'farinha de aveia ou amêndoa',
  'açúcar':           'adoçante natural (stévia)',
};

/** Flags a diary entry as high-calorie and/or high glycemic index. */
export function analisarRefeicao(
  descricao: string,
  calorias: number | null | undefined,
): AnaliseRefeicao {
  const texto = (descricao || "").toLowerCase();
  const gatilhos = ALIMENTOS_ALTO_IG.filter((termo) => texto.includes(termo));
  return {
    altaCaloria: (calorias ?? 0) > LIMITE_CALORIAS_REFEICAO,
    altoIG: gatilhos.length > 0,
    gatilhos,
  };
}
