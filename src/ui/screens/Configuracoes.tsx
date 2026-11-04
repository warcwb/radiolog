import { useState } from "react";
import type { ModoSstv } from "../../bulletins/sstvLayout";
import { normalizarIndicativo } from "../../domain/callsign";
import { Campo, Selecao } from "../components/Campo";
import { carregarConfig, salvarConfig, type Config } from "../state";

export function Configuracoes({ aoSalvar }: { aoSalvar: (c: Config) => void }) {
  const [c, setC] = useState(carregarConfig);
  const [salvo, setSalvo] = useState(false);
  const mudar = <K extends keyof Config>(k: K) => (v: Config[K]) => { setC((x) => ({ ...x, [k]: v })); setSalvo(false); };
  const salvar = () => {
    const final = { ...c, indicativo: normalizarIndicativo(c.indicativo) };
    salvarConfig(final);
    setC(final);
    setSalvo(true);
    aoSalvar(final);
  };
  return (
    <section>
      <h2>Configurações</h2>
      <Campo rotulo="Seu indicativo" valor={c.indicativo} aoMudar={mudar("indicativo")} />
      <Campo rotulo="Seu nome" valor={c.nome} aoMudar={mudar("nome")} />
      <Campo rotulo="Sigla para numerar operações" valor={c.sigla} aoMudar={mudar("sigla")} />
      <Selecao rotulo="Modo SSTV padrão" valor={c.modoSstv} aoMudar={(v) => mudar("modoSstv")(v as ModoSstv)}
        opcoes={[["ROBOT36", "Robot36 (320×240)"], ["MARTIN1", "Martin M1 (320×256)"], ["SCOTTIE1", "Scottie S1 (320×256)"], ["PD120", "PD120 (640×496)"]]} />
      <Selecao rotulo="Tema" valor={c.tema} aoMudar={(v) => mudar("tema")(v as Config["tema"])} opcoes={[["escuro", "Escuro"], ["claro", "Claro (sol)"], ["noturno", "Noturno (vermelho)"]]} />
      <Selecao rotulo="Tamanho da letra" valor={c.fonte} aoMudar={(v) => mudar("fonte")(v as Config["fonte"])} opcoes={[["normal", "Normal"], ["grande", "Grande"]]} />
      <button className="primario" onClick={salvar}>Salvar</button>
      {salvo && <p role="status">Configurações salvas</p>}
    </section>
  );
}
