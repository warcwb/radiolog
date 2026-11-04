import { useEffect, useState } from "react";
import { Configuracoes } from "./screens/Configuracoes";
import { NovaOperacao } from "./screens/NovaOperacao";
import { Operacoes } from "./screens/Operacoes";
import { carregarConfig, type Config, type Tela } from "./state";
import "./styles.css";

function aplicarAparencia(c: Config) {
  const h = document.documentElement;
  h.classList.remove("tema-claro", "tema-escuro", "tema-noturno", "fonte-grande");
  h.classList.add(`tema-${c.tema}`);
  if (c.fonte === "grande") h.classList.add("fonte-grande");
}

export function App({ avisos = [] }: { avisos?: string[] }) {
  const [tela, ir] = useState<Tela>({ nome: "operacoes" });
  useEffect(() => aplicarAparencia(carregarConfig()), []);

  let conteudo;
  switch (tela.nome) {
    case "nova": conteudo = <NovaOperacao ir={ir} />; break;
    case "config": conteudo = <Configuracoes aoSalvar={aplicarAparencia} />; break;
    default: conteudo = <Operacoes ir={ir} />;
  }

  return (
    <div className="app">
      <header className="topo">
        <h1>RadioLog</h1>
        <nav>
          <button onClick={() => ir({ nome: "operacoes" })}>Início</button>
          <button onClick={() => ir({ nome: "config" })}>Configurações</button>
        </nav>
      </header>
      {avisos.map((a) => <p key={a} className="aviso" role="alert">{a}</p>)}
      <main>{conteudo}</main>
    </div>
  );
}
