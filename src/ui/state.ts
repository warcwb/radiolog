import { useCallback, useEffect, useState } from "react";
import type { ModoSstv } from "../bulletins/sstvLayout";
import type { Entrada, Estacao, Operacao } from "../domain/types";
import { carregarOperacao } from "../store/repo";

export interface Config {
  indicativo: string;
  nome: string;
  sigla: string;
  modoSstv: ModoSstv;
  tema: "claro" | "escuro" | "noturno";
  fonte: "normal" | "grande";
}

export const CONFIG_PADRAO: Config = { indicativo: "", nome: "", sigla: "REER-PR", modoSstv: "ROBOT36", tema: "escuro", fonte: "normal" };
const CHAVE = "radiolog.config";

export function carregarConfig(): Config {
  try {
    const s = localStorage.getItem(CHAVE);
    return s ? { ...CONFIG_PADRAO, ...(JSON.parse(s) as Partial<Config>) } : { ...CONFIG_PADRAO };
  } catch {
    return { ...CONFIG_PADRAO };
  }
}

export function salvarConfig(c: Config): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(c));
  } catch {
    // armazenamento indisponível (aba anônima): segue com o que está em memória
  }
}

/** true quando o uso passa de 80% da cota do navegador. */
export async function verificarEspaco(): Promise<boolean> {
  const est = await navigator.storage?.estimate?.();
  if (!est?.quota || est.usage === undefined) return false;
  return est.usage / est.quota > 0.8;
}

export type Tela =
  | { nome: "operacoes" } | { nome: "nova" } | { nome: "log"; id: string } | { nome: "estacoes"; id: string }
  | { nome: "enviar"; id: string } | { nome: "encerrar"; id: string } | { nome: "importar" } | { nome: "config" };
export type Ir = (t: Tela) => void;

export interface OperacaoAtual { op: Operacao | null; estacoes: Estacao[]; entradas: Entrada[]; recarregar: () => Promise<void>; agora: string }

export function useAgora(intervaloMs = 15000): string {
  const [agora, setAgora] = useState(() => new Date().toISOString());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date().toISOString()), intervaloMs);
    return () => clearInterval(t);
  }, [intervaloMs]);
  return agora;
}

export function useOperacaoAtual(id: string): OperacaoAtual {
  const [dados, setDados] = useState<{ op: Operacao | null; estacoes: Estacao[]; entradas: Entrada[] }>({ op: null, estacoes: [], entradas: [] });
  const agora = useAgora();
  const recarregar = useCallback(async () => {
    const r = await carregarOperacao(id);
    setDados(r ?? { op: null, estacoes: [], entradas: [] });
  }, [id]);
  useEffect(() => { void recarregar(); }, [recarregar]);
  return { ...dados, recarregar, agora };
}
