import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { verificarEspaco } from "./ui/state";

async function iniciar() {
  const avisos: string[] = [];
  try {
    const persistido = await navigator.storage?.persist?.();
    if (persistido === false) avisos.push("O navegador pode apagar os dados. Faça backups.");
    if (await verificarEspaco()) avisos.push("Pouco espaço no aparelho. Faça backup e libere espaço.");
  } catch {
    // API indisponível: segue sem avisos
  }
  const raiz = document.getElementById("root");
  if (raiz) createRoot(raiz).render(<StrictMode><App avisos={avisos} /></StrictMode>);
}

void iniciar();
