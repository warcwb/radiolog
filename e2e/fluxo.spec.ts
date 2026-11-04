import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

async function registrar(page: Page, indicativo: string, opcoes: { nova?: boolean; funcao?: string; tipo?: string } = {}) {
  await page.getByLabel("Indicativo", { exact: true }).fill(indicativo);
  if (opcoes.tipo) await page.getByRole("button", { name: opcoes.tipo, exact: true }).click();
  await page.getByRole("button", { name: "REGISTRAR" }).click();
  if (opcoes.nova) {
    const cadastro = page.getByRole("group", { name: `Nova estação ${indicativo}` });
    if (opcoes.funcao) await cadastro.getByLabel("Função").selectOption(opcoes.funcao);
    await cadastro.getByRole("button", { name: "Salvar estação e registrar" }).click();
  }
  await expect(page.getByLabel("Indicativo", { exact: true })).toHaveValue("");
}

test("fluxo completo: configurar, registrar, corrigir, encerrar, exportar e importar", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Configurações" }).click();
  await page.getByLabel("Seu indicativo").fill("PU5NOC");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "Início" }).click();

  await page.getByRole("button", { name: "Nova operação" }).click();
  await page.getByLabel("Nome da operação").fill("Travessia teste");
  await page.getByLabel("Frequência").fill("145.210 MHz");
  await page.getByRole("button", { name: "Começar operação" }).click();

  await registrar(page, "PU5ONI", { nova: true, funcao: "CAMPO" });
  await expect(page.getByText("#1", { exact: true })).toBeVisible();
  await registrar(page, "PY5CSM", { nova: true });
  await registrar(page, "PU5VAZ", { nova: true });
  await expect(page.getByText("#3", { exact: true })).toBeVisible();

  await page.getByText("#2", { exact: true }).click();
  await page.getByRole("button", { name: "Corrigir" }).click();
  await page.getByLabel("Texto da correção").fill("QRK era 4");
  await page.getByRole("button", { name: "Confirmar correção" }).click();
  await expect(page.getByText("corrigida por #4")).toBeVisible();

  await page.getByRole("button", { name: "Encerrar", exact: true }).click();
  await expect(page.getByText("PU5ONI sem saída registrada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Encerrar operação" })).toBeDisabled();

  await page.getByRole("button", { name: "Log", exact: true }).click();
  await registrar(page, "PU5ONI", { tipo: "SAÍDA" });
  await expect(page.getByText("#5", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Encerrar", exact: true }).click();
  await page.getByLabel("Entregue a").fill("COSMO");
  await page.getByRole("button", { name: "Encerrar operação" }).click();

  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Gerar ICS 309" }).click()]);
  expect(pdf.suggestedFilename()).toMatch(/-ics309\.pdf$/);
  expect(readFileSync(await pdf.path()).length).toBeGreaterThan(1024);

  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await page.getByRole("button", { name: "SSTV", exact: true }).click();
  await page.getByLabel("Modo").selectOption("ROBOT36");
  const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Baixar PNG 1" }).click()]);
  const b = readFileSync(await png.path());
  expect(b.subarray(1, 4).toString()).toBe("PNG");
  expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([320, 240]);

  await page.getByRole("button", { name: "Início" }).click();
  await page.getByRole("button", { name: "Importar log" }).click();
  await page.getByLabel("Arquivo do log").setInputFiles(resolve("docs/referencias/exemplo-log-colega-2026-10-31.txt"));
  await expect(page.getByText("38 linhas")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar importação" }).click();
  await expect(page.getByText("#37", { exact: true })).toBeVisible();
});
