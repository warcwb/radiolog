import { useEffect, useState } from "react";
import { Configuracoes } from "./screens/Configuracoes";
import { Encerramento } from "./screens/Encerramento";
import { Enviar } from "./screens/Enviar";
import { Importar } from "./screens/Importar";
import { Estacoes } from "./screens/Estacoes";
import { LogAoVivo } from "./screens/LogAoVivo";
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
    case "log": conteudo = <LogAoVivo id={tela.id} ir={ir} />; break;
    case "estacoes": conteudo = <Estacoes id={tela.id} />; break;
    case "encerrar": conteudo = <Encerramento id={tela.id} />; break;
    case "enviar": conteudo = <Enviar id={tela.id} />; break;
    case "importar": conteudo = <Importar ir={ir} />; break;
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
      {"id" in tela && <Abas tela={tela} ir={ir} />}
    </div>
  );
}

const ABAS = [["log", "Log"], ["estacoes", "Estações"], ["enviar", "Enviar"], ["encerrar", "Encerrar"]] as const;

function Abas({ tela, ir }: { tela: Tela & { id: string }; ir: (t: Tela) => void }) {
  return (
    <nav className="abas" aria-label="Operação">
      {ABAS.map(([nome, rotulo]) => (
        <button key={nome} aria-current={tela.nome === nome ? "page" : undefined} onClick={() => ir({ nome, id: tela.id })}>{rotulo}</button>
      ))}
    </nav>
  );
}
