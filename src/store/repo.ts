import Dexie from "dexie";
import { novaCorrecao, novaEntrada } from "../domain/entries";
import type { Encerramento, Entrada, Estacao, NovaEntradaInput, Operacao } from "../domain/types";
import { db } from "./db";

// Somente acréscimo: este módulo não tem (e não deve ter) funções que editem ou apaguem entradas.

export async function salvarOperacao(op: Operacao): Promise<void> {
  await db.operacoes.put(op);
}

export async function listarOperacoes(): Promise<Operacao[]> {
  const todas = await db.operacoes.toArray();
  return todas.sort((a, b) => b.inicio.localeCompare(a.inicio));
}

export async function carregarOperacao(id: string): Promise<{ op: Operacao; estacoes: Estacao[]; entradas: Entrada[] } | null> {
  const op = await db.operacoes.get(id);
  if (!op) return null;
  const estacoes = await db.estacoes.where("operacaoId").equals(id).toArray();
  const entradas = await db.entradas.where("[operacaoId+seq]").between([id, Dexie.minKey], [id, Dexie.maxKey]).toArray();
  return { op, estacoes, entradas };
}

export async function salvarEstacao(e: Estacao): Promise<void> {
  await db.estacoes.put(e);
}

async function proximoSeq(operacaoId: string): Promise<number> {
  const ultima = await db.entradas.where("[operacaoId+seq]").between([operacaoId, Dexie.minKey], [operacaoId, Dexie.maxKey]).last();
  return (ultima?.seq ?? 0) + 1;
}

async function gravarComSeq(criar: (seq: number) => Entrada, tentativas = 2): Promise<Entrada> {
  try {
    return await db.transaction("rw", db.entradas, async () => {
      const e = criar(await proximoSeq(criar(0).operacaoId));
      await db.entradas.add(e);
      return e;
    });
  } catch (erro) {
    if (tentativas > 1 && erro instanceof Dexie.ConstraintError) return gravarComSeq(criar, tentativas - 1);
    throw erro;
  }
}

export function acrescentarEntrada(op: Operacao, input: NovaEntradaInput, agoraIso: string): Promise<Entrada> {
  return gravarComSeq((seq) => novaEntrada(op, seq, input, agoraIso));
}

export function acrescentarCorrecao(op: Operacao, corrigida: Entrada, texto: string, operador: string, agoraIso: string): Promise<Entrada> {
  return gravarComSeq((seq) => novaCorrecao(op, seq, corrigida, texto, operador, agoraIso));
}

export async function encerrarOperacao(op: Operacao, enc: Encerramento): Promise<Operacao> {
  const encerrada: Operacao = { ...op, status: "ENCERRADA", fim: enc.hora, encerramento: enc };
  await db.operacoes.put(encerrada);
  return encerrada;
}

export async function importarLote(op: Operacao, estacoes: Estacao[], entradas: Entrada[]): Promise<void> {
  await db.transaction("rw", db.operacoes, db.estacoes, db.entradas, async () => {
    await db.operacoes.put(op);
    await db.estacoes.bulkPut(estacoes.map((e) => ({ ...e, operacaoId: op.id })));
    for (const e of entradas) {
      if (!Number.isInteger(e.seq) || e.seq < 1) throw new Error(`Entrada inválida (seq ${e.seq})`);
      await db.entradas.add({ ...e, operacaoId: op.id });
    }
  });
}
