import type { Precedencia, TipoEntrada } from "../domain/types";

export const ROTULO_PRECEDENCIA: Record<Precedencia, string> = {
  EMERGENCIA: "EMERGÊNCIA", PRIORIDADE: "PRIORIDADE", BEM_ESTAR: "BEM-ESTAR", ROTINA: "ROTINA",
};

export const ROTULO_TIPO: Record<TipoEntrada, string> = {
  ENTRADA_REDE: "Entrada", SAIDA: "Saída", TRAFEGO: "Tráfego", SITUACAO: "Situação", MENSAGEM_FORMAL: "Mensagem",
  IDENTIFICACAO: "Identificação", NAO_IDENTIFICADA: "Não identificada", CORRECAO: "Correção", OBSERVACAO: "Observação",
  TROCA_OPERADOR: "Troca de operador",
};
