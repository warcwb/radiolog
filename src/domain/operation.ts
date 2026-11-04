import { dataLocalIso } from "./time";
import type { Operacao } from "./types";

const pessoa = () => ({ indicativo: "", nome: "" });

export function novaOperacao(dados: Partial<Operacao>, agoraIso: string, id?: string): Operacao {
  return {
    nome: "",
    numero: "",
    tipo: "EVENTO",
    orgaoApoiado: "",
    data: dataLocalIso(agoraIso),
    inicio: agoraIso,
    fuso: "LOCAL",
    rede: "",
    frequencia: "",
    repetidora: "",
    offset: "",
    tom: "",
    modo: "FM",
    ncs: pessoa(),
    adjunto: pessoa(),
    anotador: pessoa(),
    estacaoLog: { indicativo: "", equipamento: "", potencia: "", antena: "", grid: "" },
    minutosSemContato: 30,
    lembreteIdentMin: null,
    status: "ABERTA",
    ...dados,
    id: id ?? dados.id ?? crypto.randomUUID(),
  };
}

export function sugerirNumero(sigla: string, ano: number, existentes: string[]): string {
  const prefixo = `${sigla}-${ano}-`;
  const maior = existentes
    .filter((n) => n.startsWith(prefixo))
    .map((n) => Number(n.slice(prefixo.length)))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefixo}${String(maior + 1).padStart(3, "0")}`;
}

export function copiarConfiguracao(o: Operacao): Partial<Operacao> {
  const { tipo, orgaoApoiado, fuso, rede, frequencia, repetidora, offset, tom, modo, ncs, adjunto, anotador, estacaoLog, minutosSemContato, lembreteIdentMin } = o;
  return structuredClone({ tipo, orgaoApoiado, fuso, rede, frequencia, repetidora, offset, tom, modo, ncs, adjunto, anotador, estacaoLog, minutosSemContato, lembreteIdentMin });
}
