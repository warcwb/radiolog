export type TipoOperacao = "REAL" | "EXERCICIO" | "EVENTO";
export type Fuso = "LOCAL" | "UTC";
export type Funcao = "CAMPO" | "BASE" | "FIXA" | "MOVEL";
export type TipoEntrada =
  | "ENTRADA_REDE" | "SAIDA" | "TRAFEGO" | "SITUACAO" | "MENSAGEM_FORMAL"
  | "IDENTIFICACAO" | "NAO_IDENTIFICADA" | "CORRECAO" | "OBSERVACAO" | "TROCA_OPERADOR";
export type Precedencia = "EMERGENCIA" | "PRIORIDADE" | "BEM_ESTAR" | "ROTINA";

export interface Pessoa { indicativo: string; nome: string }

export interface EstacaoLog { indicativo: string; equipamento: string; potencia: string; antena: string; grid: string }

export interface Encerramento {
  hora: string;
  totalEstacoes: number;
  pendencias: { estacao: string; texto: string }[];
  justificativa: string;
  responsavel: string;
  entregueA: string;
}

export interface Operacao {
  id: string;
  nome: string;
  numero: string;
  tipo: TipoOperacao;
  orgaoApoiado: string;
  /** YYYY-MM-DD (data local) */
  data: string;
  /** ISO */
  inicio: string;
  fim?: string;
  fuso: Fuso;
  rede: string;
  frequencia: string;
  repetidora: string;
  offset: string;
  tom: string;
  modo: string;
  ncs: Pessoa;
  adjunto: Pessoa;
  anotador: Pessoa;
  estacaoLog: EstacaoLog;
  minutosSemContato: number;
  lembreteIdentMin: number | null;
  status: "ABERTA" | "ENCERRADA";
  encerramento?: Encerramento;
}

export interface Estacao {
  operacaoId: string;
  /** indicativo normalizado, ou o tático em maiúsculas */
  chave: string;
  indicativo: string;
  tatico: string;
  nome: string;
  equipamento: string;
  local: string;
  grid: string;
  funcao: Funcao;
}

export interface Entrada {
  operacaoId: string;
  seq: number;
  hora: string;
  horaRegistro: string;
  horaDesconhecida: boolean;
  operador: string;
  tipo: TipoEntrada;
  /** chave da estação ou texto livre */
  de: string;
  para: string;
  qsa?: number;
  qrk?: number;
  local: string;
  grid: string;
  precedencia: Precedencia;
  teste: boolean;
  numMensagem: string;
  texto: string;
  sensivel: boolean;
  corrige?: number;
  posEncerramento: boolean;
  origem: "DIGITADO" | "IMPORTADO";
}

type Opcionais = "local" | "grid" | "numMensagem" | "precedencia" | "sensivel" | "horaDesconhecida" | "origem" | "para";
export type NovaEntradaInput =
  Omit<Entrada, "operacaoId" | "seq" | "horaRegistro" | "teste" | "posEncerramento" | Opcionais>
  & Partial<Pick<Entrada, Opcionais>>;
