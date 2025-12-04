// Tipos de Dados
export type Registro = {
  id: number;
  planta: number;
  doencaOuPraga: string;
  orgao: string;
  quadrante?: string;
  ramo?: string;
  local?: string | PontoLocalizacao;
  numeroLocal?: number | null; 
  nota?: number;
  lote: string;
  centroCusto: string;
  criadoEm: string;
  localId?: number;
  identificadorDeLocal?: string | null;
  nomeAvaliador?: string;
};

export type Orgao = {
  nome: string;
  notaMax: number;
  precisaRamo?: boolean;
};

export type DoencaPraga = {
  nome: string;
  tipo: "doenca" | "praga";
  orgaos: Orgao[];
  locais?: string[];
  avaliacoesExtras?: string[];
  observacoes?: boolean;
};

export interface LocalPlantaItem {
  id: number | string;
  name: string;
  centroCusto: string;
}

export interface Orgao2 {
  nome: string;
  totalNotas?: number;
  porcentagem?: number;
  totalBordadura?: number;
  totalArea?: number;
  porcentagemBordadura?: number;
  porcentagemArea?: number;
  porcentagemMedia?: number;
  grupoPorLocal?: Record<string, Record<string, Record<string, number[]>>>;
}

export interface ItemResumo {
  nome: string;
  tipo: "doenca" | "praga";
  percentualComposto?: number;
  orgaos?: Orgao2[];
}

export type PontoLocalizacao = {
  id: number;
  lote: string;
  latitude: number;
  longitude: number;
  timestamp: number;
};

// Dados Constantes
export const bordadura = Array.from({ length: 4 }, (_, i) => i + 1);
export const areaInterna = Array.from({ length: 6 }, (_, i) => i + 1);
export const ramos = ["R1", "R2"];
export const quadrantes = ["Q1", "Q2", "Q3", "Q4"];

export const locaPlanta: LocalPlantaItem[] = [
  { id: 1, name: "GV-F1 MANGA TOMMY 01", centroCusto: "1.5.1.01.01" },
  { id: 2, name: "GV-F1 MANGA PALMER 02", centroCusto: "1.5.1.01.02" },
  { id: 3, name: "GV-F1 MANGA PALMER 03", centroCusto: "1.5.1.01.03" },
  { id: 4, name: "GV-F1 MANGA PALMER 04.1", centroCusto: "1.5.1.01.04" },
  { id: 5, name: "GV-F1 MANGA KEITT 04.2", centroCusto: "1.5.1.01.05" },
  { id: 6, name: "GV-F1 MANGA PALMER 05", centroCusto: "1.5.1.01.06" },
  { id: 7, name: "GV-F1 MANGA TOMMY 06", centroCusto: "1.5.1.01.07" },
  { id: 8, name: "GV-F1 MANGA PALMER 07", centroCusto: "1.5.1.01.08" },
  { id: 9, name: "GV-F1 MANGA TOMMY 08", centroCusto: "1.5.1.01.09" },
  { id: 10, name: "GV-F1 MANGA TOMMY 09", centroCusto: "1.5.1.01.10" },
  { id: 11, name: "GV-F1 MANGA KEITT 10", centroCusto: "1.5.1.01.11" },
  { id: 12, name: "GV-F1 MANGA PALMER 11", centroCusto: "1.5.1.01.12" },
  { id: 13, name: "GV-F1 MANGA PALMER 12", centroCusto: "1.5.1.01.13" },
  { id: 14, name: "GV-F1 MANGA PALMER 13", centroCusto: "1.5.1.01.14" },
  { id: 15, name: "GV-F1 MANGA PALMER 14", centroCusto: "1.5.1.01.15" },
  { id: 16, name: "GV-F1 MANGA PALMER 15.1", centroCusto: "1.5.1.01.16" },
  { id: 17, name: "GV-F1 MANGA KEITT 15.2", centroCusto: "1.5.1.01.17" },
  { id: 18, name: "GV-F1 MANGA PALMER 16", centroCusto: "1.5.1.01.18" },
  { id: 19, name: "GV-F1 MANGA PALMER 17.1", centroCusto: "1.5.1.01.19" },
  { id: 20, name: "GV-F1 MANGA PALMER 17.2", centroCusto: "1.5.1.01.20" },
  { id: 21, name: "GV-F1 MANGA PALMER 18", centroCusto: "1.5.1.01.21" },
  { id: 22, name: "GV-F1 MANGA PALMER 19", centroCusto: "1.5.1.01.22" },
  { id: 23, name: "GV-F1 MANGA KENT 27", centroCusto: "1.5.1.01.23" },
  { id: 24, name: "GV-F1 MANGA KENT 31", centroCusto: "1.5.1.01.24" },
  { id: 25, name: "GV-F1 MANGA KENT 32", centroCusto: "1.5.1.01.25" },
  { id: 26, name: "GV-F1 MANGA KENT 33", centroCusto: "1.5.1.01.26" },
  { id: 27, name: "GV-F1 MANGA KENT 34", centroCusto: "1.5.1.01.27" },
  { id: 28, name: "GV-F2 MANGA TOMMY 22.1", centroCusto: "1.5.1.02.01" },
  { id: 29, name: "GV-F2 MANGA PALMER 22.2", centroCusto: "1.5.1.02.02" },
  { id: 30, name: "GV-F2 MANGA TOMMY 23", centroCusto: "1.5.1.02.03" },
  { id: 31, name: "GV-F2 MANGA TOMMY 24", centroCusto: "1.5.1.02.04" },
  { id: 32, name: "GV-F2 MANGA PALMER 25", centroCusto: "1.5.1.02.05" },
  { id: 33, name: "GV-F2 MANGA TOMMY 26", centroCusto: "1.5.1.02.06" },
  { id: 34, name: "GV-F2 MANGA KEITT 28", centroCusto: "1.5.1.02.07" },
  { id: 35, name: "GV-F2 MANGA KEITT 29", centroCusto: "1.5.1.02.08" },
  { id: 36, name: "GV-F2 MANGA KEITT 30", centroCusto: "1.5.1.02.09" },
  { id: 37, name: "GV-F3 MANGA KEITT 20", centroCusto: "1.5.1.03.01" },
  { id: 38, name: "GV-F3 MANGA PALMER 21", centroCusto: "1.5.1.03.02" },
];

export const doencasPragas: DoencaPraga[] = [
  {
    nome: "MORTE DESCENDENTE",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "RAMO", notaMax: 2, precisaRamo: false },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "OÍDIO",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MALFORMAÇÃO E MICROÁCARO",
    tipo: "doenca",
    orgaos: [
      { nome: "VEGETATIVA", notaMax: 2, precisaRamo: false },
      { nome: "FLORAL", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MANCHA ANGULAR",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "ANTRACNOSE",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "INFLORESC.", notaMax: 2, precisaRamo: false },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "MANCHA DE ALTERNARIA",
    tipo: "doenca",
    orgaos: [
      { nome: "FOLHA", notaMax: 5, precisaRamo: true },
      { nome: "FRUTO", notaMax: 2, precisaRamo: false },
    ],
  },
  {
    nome: "TRIPES",
    tipo: "praga",
    orgaos: [
      { nome: "RAMO", notaMax: 2 },
      { nome: "INFLORESC.", notaMax: 5 },
      { nome: "FRUTO", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "PULGÃO",
    tipo: "praga",
    orgaos: [
      { nome: "BROTAÇÃO", notaMax: 2 },
      { nome: "INFLORESC.", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "LEPIDÓPTEROS",
    tipo: "praga",
    orgaos: [{ nome: "INFLORESC.", notaMax: 1 }],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "MOSQUINHA DA MANGA",
    tipo: "praga",
    orgaos: [
      { nome: "BROTAÇÃO", notaMax: 2 },
      { nome: "FOLHAS NOVAS", notaMax: 2 },
      { nome: "RAMO", notaMax: 2 },
      { nome: "INFLORESCÊNCIA", notaMax: 1 },
      { nome: "FRUTO (chumbinho)", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
    avaliacoesExtras: ["1ª Av.", "2ª Av."],
  },
  {
    nome: "COCHONILHA",
    tipo: "praga",
    orgaos: [
      {
        nome: "FOLHA (Aulacaspis e Pseudaonidia)",
        notaMax: 1,
        precisaRamo: true,
      },
      { nome: "FRUTO (Pseudococus sp.)", notaMax: 1, precisaRamo: true },
      { nome: "FRUTO (Pseudaonidia tribitiformis)", notaMax: 1 },
    ],
    locais: ["Bordadura", "Área interna da parcela"],
  },
  {
    nome: "INIMIGOS NATURAIS",
    tipo: "praga",
    orgaos: [
      {
        nome: "BICHO LIXEIRO (Ovo)",
        notaMax: 0,
      },
      {
        nome: "BICHO LIXEIRO (Larva)",
        notaMax: 0,
      },
      {
        nome: "BICHO LIXEIRO (Adulto)",
        notaMax: 0,
      },
      {
        nome: "JOANINHA (Larva)",
        notaMax: 0,
      },
      {
        nome: "JOANINHA (Adulto)",
        notaMax: 0,
      },
      {
        nome: "ÁCARO PREDADOR",
        notaMax: 0,
      },
      {
        nome: "ARANHA",
        notaMax: 0,
      },
    ],
    observacoes: true,
  },
];
