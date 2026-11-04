import { useState } from "react";
import { montarBoletim } from "../../bulletins/sstvLayout";
import { desenharPagina } from "../../bulletins/sstvRender";
import { validarEncerramento } from "../../domain/closing";
import type { Operacao } from "../../domain/types";
import { gerarIcs309 } from "../../export/ics309";
import { encerrarOperacao } from "../../store/repo";
import { Campo } from "../components/Campo";
import { baixarArquivo } from "../download";
import { carregarConfig, useOperacaoAtual } from "../state";

interface Props { id: string; agoraFixo?: string; baixar?: typeof baixarArquivo }

export function Encerramento({ id, agoraFixo, baixar = baixarArquivo }: Props) {
  const config = carregarConfig();
  const { op, estacoes, entradas, recarregar } = useOperacaoAtual(id);
  const [justificativa, setJustificativa] = useState("");
  const [pendencias, setPendencias] = useState("");
  const [responsavel, setResponsavel] = useState(config.indicativo);
  const [entregueA, setEntregueA] = useState("");
  if (!op) return <p>Carregando…</p>;
  const v = validarEncerramento(op, estacoes, entradas, justificativa);
  const agora = agoraFixo ?? new Date().toISOString();

  const encerrar = async () => {
    await encerrarOperacao(op, {
      hora: agora, totalEstacoes: v.totalEstacoes, justificativa: justificativa.trim(), responsavel, entregueA,
      pendencias: pendencias.split("\n").map((t) => t.trim()).filter(Boolean).map((texto) => ({ estacao: "", texto })),
    });
    await recarregar();
  };

  if (op.status === "ENCERRADA") return <Documentos op={op} baixar={baixar} gerarPdf={() => gerarIcs309(op, estacoes, entradas)} gerarSstv={() => montarBoletim(op, estacoes, entradas, "ENCERRAMENTO", config.modoSstv, agora)} />;

  return (
    <section>
      <h2>Encerramento</h2>
      <ul className="checklist">
        {v.camposSemSaida.length
          ? v.camposSemSaida.map((c) => <li key={c} className="pendente">{c} sem saída registrada</li>)
          : <li className="ok">Todas as equipes de campo registraram saída.</li>}
        <li>Estações que participaram: {v.totalEstacoes}</li>
      </ul>
      <div className="campo">
        <label htmlFor="rl-just">Justificativa</label>
        <textarea id="rl-just" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
        {v.camposSemSaida.length > 0 && <small>Obrigatória quando há equipe de campo sem saída.</small>}
      </div>
      <div className="campo">
        <label htmlFor="rl-pend">Pendências (uma por linha)</label>
        <textarea id="rl-pend" value={pendencias} onChange={(e) => setPendencias(e.target.value)} />
      </div>
      <Campo rotulo="Responsável" valor={responsavel} aoMudar={setResponsavel} />
      <Campo rotulo="Entregue a" valor={entregueA} aoMudar={setEntregueA} />
      <button className="primario" disabled={!v.ok} onClick={() => void encerrar()}>Encerrar operação</button>
    </section>
  );
}

function Documentos({ op, baixar, gerarPdf, gerarSstv }: { op: Operacao; baixar: typeof baixarArquivo; gerarPdf: () => Uint8Array; gerarSstv: () => ReturnType<typeof montarBoletim> }) {
  const sstv = () => {
    const modo = carregarConfig().modoSstv;
    gerarSstv().forEach((p, i) => desenharPagina(p, modo).toBlob?.((b) => b && baixar(`${op.numero}-sstv-encerramento-${i + 1}.png`, b, "image/png")));
  };
  return (
    <section>
      <h2>Operação encerrada</h2>
      <p>Gere os documentos para entregar e transmitir:</p>
      <div className="acoes">
        <button className="primario" onClick={() => baixar(`${op.numero}-ics309.pdf`, gerarPdf(), "application/pdf")}>Gerar ICS 309</button>
        <button onClick={sstv}>Boletim final SSTV</button>
      </div>
    </section>
  );
}
