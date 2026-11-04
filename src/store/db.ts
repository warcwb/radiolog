import Dexie, { type Table } from "dexie";
import type { Entrada, Estacao, Operacao } from "../domain/types";

export class BancoRadioLog extends Dexie {
  operacoes!: Table<Operacao, string>;
  estacoes!: Table<Estacao, [string, string]>;
  entradas!: Table<Entrada, [string, number]>;

  constructor() {
    super("radiolog");
    this.version(1).stores({
      operacoes: "id",
      estacoes: "[operacaoId+chave], operacaoId",
      entradas: "[operacaoId+seq], operacaoId",
    });
  }
}

export const db = new BancoRadioLog();
