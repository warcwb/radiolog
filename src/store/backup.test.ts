import { gerarBackup, lerBackup, precisaLembreteBackup } from "./backup";
import { entrada, estacao, op } from "../test/fabrica";

test("backup vai e volta sem perda", () => {
  const o = op();
  const b = gerarBackup(o, [estacao("PU5ONI")], [entrada(o, "PU5ONI", 0, { texto: "Ação \"x\"" })]);
  expect(lerBackup(JSON.stringify(b))).toEqual(b);
  expect(b).toMatchObject({ formato: "radiolog-backup", versao: 1 });
});

test("rejeita arquivo que não é backup", () => {
  expect(() => lerBackup("{}")).toThrow("Arquivo não é um backup do RadioLog");
  expect(() => lerBackup("não é json")).toThrow("Arquivo não é um backup do RadioLog");
});

test("lembrete a cada 30 entradas", () => {
  expect(precisaLembreteBackup(30)).toBe(true);
  expect(precisaLembreteBackup(60)).toBe(true);
  expect(precisaLembreteBackup(29)).toBe(false);
  expect(precisaLembreteBackup(0)).toBe(false);
});
