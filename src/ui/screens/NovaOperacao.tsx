import { useEffect, useState } from "react";
import { normalizarIndicativo } from "../../domain/callsign";
import { copiarConfiguracao, novaOperacao, sugerirNumero } from "../../domain/operation";
import type { Operacao, TipoOperacao } from "../../domain/types";
import { listarOperacoes, salvarOperacao } from "../../store/repo";
import { Campo, Selecao } from "../components/Campo";
import { carregarConfig, type Ir } from "../state";

export function NovaOperacao({ ir }: { ir: Ir }) {
  const config = carregarConfig();
  const [anteriores, setAnteriores] = useState<Operacao[]>([]);
  const [d, setD] = useState<Operacao>(() => novaOperacao({ estacaoLog: { indicativo: config.indicativo, equipamento: "", potencia: "", antena: "", grid: "" }, anotador: { indicativo: config.indicativo, nome: config.nome } }, new Date().toISOString()));
  const [lembrete, setLembrete] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    void listarOperacoes().then((ops) => {
      setAnteriores(ops);
      setD((x) => ({ ...x, numero: sugerirNumero(config.sigla, new Date().getFullYear(), ops.map((o) => o.numero)) }));
    });
  }, [config.sigla]);

  const mudar = <K extends keyof Operacao>(k: K) => (v: Operacao[K]) => setD((x) => ({ ...x, [k]: v }));
  const copiar = (id: string) => {
    const o = anteriores.find((x) => x.id === id);
    if (o) setD((x) => ({ ...x, ...copiarConfiguracao(o) }));
  };
  const salvar = async () => {
    if (!d.nome.trim()) return setErro("Informe o nome");
    if (!d.frequencia.trim()) return setErro("Informe a frequência");
    const op: Operacao = { ...d, inicio: new Date().toISOString(), lembreteIdentMin: lembrete.trim() ? Number(lembrete) : null, ncs: { ...d.ncs, indicativo: normalizarIndicativo(d.ncs.indicativo) } };
    await salvarOperacao(op);
    ir({ nome: "log", id: op.id });
  };

  return (
    <section>
      <h2>Nova operação</h2>
      {anteriores.length > 0 && (
        <Selecao rotulo="Copiar configuração de operação anterior" valor="" aoMudar={copiar}
          opcoes={[["", "— não copiar —"], ...anteriores.map((o): [string, string] => [o.id, `${o.nome} (${o.numero})`])]} />
      )}
      <Campo rotulo="Nome da operação" valor={d.nome} aoMudar={mudar("nome")} />
      <Campo rotulo="Número" valor={d.numero} aoMudar={mudar("numero")} />
      <Selecao rotulo="Tipo" valor={d.tipo} aoMudar={(v) => mudar("tipo")(v as TipoOperacao)} opcoes={[["EVENTO", "Apoio a evento"], ["EXERCICIO", "Exercício"], ["REAL", "Ocorrência real"]]} />
      <Campo rotulo="Órgão apoiado" valor={d.orgaoApoiado} aoMudar={mudar("orgaoApoiado")} />
      <Campo rotulo="Rede" valor={d.rede} aoMudar={mudar("rede")} />
      <Campo rotulo="Frequência" valor={d.frequencia} aoMudar={mudar("frequencia")} />
      <Campo rotulo="Repetidora" valor={d.repetidora} aoMudar={mudar("repetidora")} />
      <Campo rotulo="Offset" valor={d.offset} aoMudar={mudar("offset")} />
      <Campo rotulo="Tom" valor={d.tom} aoMudar={mudar("tom")} />
      <Campo rotulo="Modo" valor={d.modo} aoMudar={mudar("modo")} />
      <Campo rotulo="NCS (controlador da rede)" valor={d.ncs.indicativo} aoMudar={(v) => mudar("ncs")({ ...d.ncs, indicativo: v })} />
      <Campo rotulo="Equipamento da estação" valor={d.estacaoLog.equipamento} aoMudar={(v) => mudar("estacaoLog")({ ...d.estacaoLog, equipamento: v })} />
      <Campo rotulo="Grid" valor={d.estacaoLog.grid} aoMudar={(v) => mudar("estacaoLog")({ ...d.estacaoLog, grid: v })} />
      <Selecao rotulo="Fuso" valor={d.fuso} aoMudar={(v) => mudar("fuso")(v as Operacao["fuso"])} opcoes={[["LOCAL", "Hora local"], ["UTC", "UTC"]]} />
      <Campo rotulo="Minutos para sem contato" tipo="number" valor={String(d.minutosSemContato)} aoMudar={(v) => mudar("minutosSemContato")(Number(v) || 0)} />
      <Campo rotulo="Lembrete de identificação (min)" tipo="number" valor={lembrete} aoMudar={setLembrete} dica="Vazio = desligado" />
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button className="primario" onClick={() => void salvar()}>Começar operação</button>
    </section>
  );
}
