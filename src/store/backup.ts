import type { Entrada, Estacao, Operacao } from "../domain/types";

export interface Backup { formato: "radiolog-backup"; versao: 1; operacao: Operacao; estacoes: Estacao[]; entradas: Entrada[] }

export function gerarBackup(operacao: Operacao, estacoes: Estacao[], entradas: Entrada[]): Backup {
  return { formato: "radiolog-backup", versao: 1, operacao, estacoes, entradas };
}

export function lerBackup(json: string): Backup {
  let b: Partial<Backup>;
  try {
    b = JSON.parse(json) as Partial<Backup>;
  } catch {
    b = {};
  }
  if (b?.formato !== "radiolog-backup" || b.versao !== 1 || !b.operacao || !Array.isArray(b.estacoes) || !Array.isArray(b.entradas))
    throw new Error("Arquivo não é um backup do RadioLog");
  return b as Backup;
}

export const precisaLembreteBackup = (total: number) => total > 0 && total % 30 === 0;
