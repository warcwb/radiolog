import { normalizarIndicativo } from "./callsign";
import { detectarSensivel } from "./sensitive";
import type { Entrada, NovaEntradaInput, Operacao } from "./types";

export class OperacaoEncerradaError extends Error {
  constructor() {
    super("Operação encerrada: só é possível registrar observações e correções.");
    this.name = "OperacaoEncerradaError";
  }
}

export function novaEntrada(op: Operacao, seq: number, input: NovaEntradaInput, agoraIso: string): Entrada {
  const encerrada = op.status === "ENCERRADA";
  if (encerrada && input.tipo !== "OBSERVACAO" && input.tipo !== "CORRECAO") throw new OperacaoEncerradaError();
  return {
    local: "",
    grid: "",
    numMensagem: "",
    precedencia: "ROTINA",
    horaDesconhecida: false,
    origem: "DIGITADO",
    para: op.ncs.indicativo || op.estacaoLog.indicativo,
    sensivel: detectarSensivel(input.texto),
    ...input,
    operacaoId: op.id,
    seq,
    horaRegistro: agoraIso,
    teste: op.tipo === "EXERCICIO",
    posEncerramento: encerrada,
  };
}

export function novaCorrecao(op: Operacao, seq: number, corrigida: Entrada, texto: string, operador: string, agoraIso: string): Entrada {
  return novaEntrada(op, seq, { hora: agoraIso, operador, tipo: "CORRECAO", de: operador, para: corrigida.para, texto, corrige: corrigida.seq }, agoraIso);
}

export function entradasCorrigidas(entradas: Entrada[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const e of entradas) if (e.tipo === "CORRECAO" && e.corrige !== undefined) m.set(e.corrige, e.seq);
  return m;
}

export function operadorAtual(entradas: Entrada[], padrao: string): string {
  for (let i = entradas.length - 1; i >= 0; i--) {
    const e = entradas[i];
    if (e?.tipo === "TROCA_OPERADOR") return normalizarIndicativo(e.de);
  }
  return padrao;
}
