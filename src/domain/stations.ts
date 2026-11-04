import type { Entrada, Estacao, Operacao } from "./types";

export type Situacao = "ATIVA" | "SAIDA" | "SEM_CONTATO";
export interface SituacaoEstacao {
  estacao: Estacao;
  situacao: Situacao;
  ultimaHora?: string;
  ultimoLocal: string;
  ultimoQsa?: number;
  ultimoQrk?: number;
  minutosSemContato?: number;
}

const NAO_OUVIDA = new Set(["CORRECAO", "OBSERVACAO", "TROCA_OPERADOR"]);

export const contaComoOuvida = (e: Entrada) => !NAO_OUVIDA.has(e.tipo);
export const ehDeCampo = (e: Estacao) => e.funcao === "CAMPO" || e.funcao === "MOVEL";

/** paraBoletim: ignora o local de entradas sensíveis (o que vai ao ar). */
export function situacaoEstacoes(op: Operacao, estacoes: Estacao[], entradas: Entrada[], agoraIso: string, opcoes: { paraBoletim?: boolean } = {}): SituacaoEstacao[] {
  const agora = new Date(agoraIso).getTime();
  const r = estacoes.map((estacao): SituacaoEstacao => {
    const ouvidas = entradas.filter((e) => e.de === estacao.chave && contaComoOuvida(e));
    const ultima = ouvidas.reduce<Entrada | undefined>((a, e) => (!a || e.hora >= a.hora ? e : a), undefined);
    const comLocal = [...ouvidas].reverse().find((e) => e.local && !(opcoes.paraBoletim && e.sensivel));
    const s: SituacaoEstacao = { estacao, situacao: "ATIVA", ultimoLocal: comLocal?.local ?? estacao.local };
    if (!ultima) return s;
    const minutos = Math.floor((agora - new Date(ultima.hora).getTime()) / 60000);
    s.ultimaHora = ultima.hora;
    s.minutosSemContato = minutos;
    if (ultima.qsa !== undefined) s.ultimoQsa = ultima.qsa;
    if (ultima.qrk !== undefined) s.ultimoQrk = ultima.qrk;
    if (ultima.tipo === "SAIDA") s.situacao = "SAIDA";
    else if (ehDeCampo(estacao) && minutos > op.minutosSemContato) s.situacao = "SEM_CONTATO";
    return s;
  });
  return r.sort((a, b) => {
    const ca = ehDeCampo(a.estacao), cb = ehDeCampo(b.estacao);
    if (ca !== cb) return ca ? -1 : 1;
    if (ca) return (b.minutosSemContato ?? -1) - (a.minutosSemContato ?? -1);
    return a.estacao.chave.localeCompare(b.estacao.chave);
  });
}
