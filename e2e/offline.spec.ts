import { expect, test } from "@playwright/test";

test("funciona sem internet depois do primeiro acesso", async ({ page, context }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "RadioLog" })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "RadioLog" })).toBeVisible();

  await page.getByRole("button", { name: "Configurações" }).click();
  await page.getByLabel("Seu indicativo").fill("PU5NOC");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "Início" }).click();
  await page.getByRole("button", { name: "Nova operação" }).click();
  await page.getByLabel("Nome da operação").fill("Sem internet");
  await page.getByLabel("Frequência").fill("145.210 MHz");
  await page.getByRole("button", { name: "Começar operação" }).click();
  await page.getByRole("button", { name: "IDENT", exact: true }).click();
  await expect(page.getByText("#1", { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Sem internet/ }).click();
  await expect(page.getByText("#1", { exact: true })).toBeVisible();
  await context.setOffline(false);
});
