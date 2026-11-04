import { db } from "../store/db";
import { carregarOperacao } from "../store/repo";
import { op } from "../test/fabrica";
import { aplicarImportacao } from "./preview";
import { interpretarTxtColega } from "./txtColega";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

test("aplicar importação grava a operação com as entradas", async () => {
  const p = interpretarTxtColega("2026.10.31\n14:00 PU5ONI QSA-5 QRK-5 - Edilson\n14:05 PU5ONI QSA-5 QRK-4", "PU5NOC");
  const base = op({ id: "nova", nome: "" });
  const gravada = await aplicarImportacao(p, base);
  expect(gravada).toMatchObject({ id: "nova", data: "2026-10-31" });
  const r = await carregarOperacao("nova");
  expect(r?.entradas.map((e) => [e.seq, e.operacaoId, e.tipo])).toEqual([[1, "nova", "ENTRADA_REDE"], [2, "nova", "SITUACAO"]]);
  expect(r?.estacoes[0]).toMatchObject({ chave: "PU5ONI", nome: "Edilson", operacaoId: "nova" });
});
