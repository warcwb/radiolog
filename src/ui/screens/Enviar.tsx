import { useEffect, useState } from "react";
import { aprsStatusEstacoes } from "../../bulletins/aprs";
import { montarBoletim, MODOS, type ModeloBoletim, type ModoSstv } from "../../bulletins/sstvLayout";
import { desenharPagina } from "../../bulletins/sstvRender";
import { roteiroVoz } from "../../bulletins/voice";
import { exportarCsv } from "../../export/csv";
import { gerarIcs309 } from "../../export/ics309";
import { gerarPartesQr, partesParaImagens } from "../../export/qr";
import { exportarTxt } from "../../export/txt";
import { gerarBackup } from "../../store/backup";
import { Selecao } from "../components/Campo";
import { baixarArquivo } from "../download";
import { carregarConfig, useOperacaoAtual } from "../state";

type Aba = "SSTV" | "APRS" | "Voz" | "QR / arquivo" | "ICS 309";
const ABAS: Aba[] = ["SSTV", "APRS", "Voz", "QR / arquivo", "ICS 309"];

interface Props { id: string; agoraFixo?: string; baixar?: typeof baixarArquivo; gerarPdf?: typeof gerarIcs309 }

export function Enviar({ id, agoraFixo, baixar = baixarArquivo, gerarPdf = gerarIcs309 }: Props) {
  const { op, estacoes, entradas, agora: agoraReal } = useOperacaoAtual(id);
  const [aba, setAba] = useState<Aba | null>(null);
  const [modo, setModo] = useState<ModoSstv>(carregarConfig().modoSstv);
  const [modelo, setModelo] = useState<ModeloBoletim>("SITUACAO");
  const [copia, setCopia] = useState<Record<number, "ok" | "falhou">>({});
  const [qrs, setQrs] = useState<string[] | null>(null);
  const [qrAtual, setQrAtual] = useState(0);
  const [erroPdf, setErroPdf] = useState("");
  useEffect(() => { setCopia({}); }, [aba]);
  if (!op) return <p>Carregando…</p>;
  const agora = agoraFixo ?? agoraReal;
  const sensiveis = entradas.filter((e) => e.sensivel).length;
  const avisoSensivel = sensiveis > 0 && aba !== null && ["SSTV", "APRS", "Voz"].includes(aba)
    ? <p className="aviso">{sensiveis} dado(s) sensível(is) ocultado(s)</p> : null;
  const csv = () => baixar(`${op.numero}.csv`, exportarCsv(op, estacoes, entradas), "text/csv");

  const paginas = montarBoletim(op, estacoes, entradas, modelo, modo, agora);
  const aprs = aprsStatusEstacoes(op, estacoes, entradas, agora);
  const copiar = async (i: number, t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      setCopia((c) => ({ ...c, [i]: "ok" }));
    } catch {
      setCopia((c) => ({ ...c, [i]: "falhou" }));
    }
  };
  const png = (i: number) => {
    const p = paginas[i];
    if (p) desenharPagina(p, modo).toBlob?.((b) => b && baixar(`${op.numero}-sstv-${modelo.toLowerCase()}-${i + 1}.png`, b, "image/png"));
  };
  const pdf = () => {
    try {
      baixar(`${op.numero}-ics309.pdf`, gerarPdf(op, estacoes, entradas), "application/pdf");
      setErroPdf("");
    } catch (e) {
      setErroPdf(`Não foi possível gerar o PDF: ${(e as Error).message}`);
    }
  };

  return (
    <section>
      <h2>Enviar</h2>
      <div className="acoes">{ABAS.map((a) => <button key={a} aria-pressed={aba === a} onClick={() => setAba(a)}>{a}</button>)}</div>
      {avisoSensivel}
      {aba === "SSTV" && (
        <div>
          <Selecao rotulo="Boletim" valor={modelo} aoMudar={(v) => setModelo(v as ModeloBoletim)} opcoes={[["SITUACAO", "Situação geral"], ["EQUIPES", "Equipes em campo"], ["PENDENCIAS", "Pendências e alertas"], ["ENCERRAMENTO", "Encerramento"]]} />
          <Selecao rotulo="Modo" valor={modo} aoMudar={(v) => setModo(v as ModoSstv)} opcoes={(Object.keys(MODOS) as ModoSstv[]).map((m): [string, string] => [m, `${m} (${MODOS[m].largura}×${MODOS[m].altura})`])} />
          {paginas.map((p, i) => (
            <figure key={i} className="previa-sstv" style={{ aspectRatio: `${MODOS[modo].largura} / ${MODOS[modo].altura}` }}>
              <div className="sstv-cab">{p.cabecalho}</div>
              {p.linhas.map((l, j) => <div key={j} className={l.emergencia ? "sstv-emerg" : ""}>{l.texto}</div>)}
              <div className="sstv-rod">{p.rodape}</div>
              <button onClick={() => png(i)}>Baixar PNG {i + 1}</button>
            </figure>
          ))}
          <p><small>Abra o PNG no app de SSTV (Robot36, MMSSTV, QSSTV) e transmita no modo escolhido.</small></p>
        </div>
      )}
      {aba === "APRS" && (
        <ul className="lista">
          {aprs.map((m, i) => (
            <li key={i} className="aprs">
              <code>{m}</code> <button onClick={() => void copiar(i, m)}>Copiar</button>
              {copia[i] === "ok" && <span> Copiado</span>}
              {copia[i] === "falhou" && <div><small>Selecione e copie o texto:</small><textarea readOnly value={m} /></div>}
            </li>
          ))}
        </ul>
      )}
      {aba === "Voz" && <pre className="roteiro">{roteiroVoz(op, estacoes, entradas, agora)}</pre>}
      {aba === "QR / arquivo" && (
        <div>
          <div className="acoes">
            <button onClick={() => baixar(`${op.numero}-backup.json`, JSON.stringify(gerarBackup(op, estacoes, entradas)), "application/json")}>Arquivo de backup (JSON)</button>
            <button onClick={() => baixar(`${op.numero}.txt`, exportarTxt(op, estacoes, entradas), "text/plain")}>TXT</button>
            <button onClick={csv}>CSV (planilha)</button>
            <button onClick={() => void partesParaImagens(gerarPartesQr(gerarBackup(op, estacoes, entradas))).then((q) => { setQrs(q); setQrAtual(0); })}>Mostrar QR codes</button>
          </div>
          {qrs && (
            <div className="qr">
              <p>QR {qrAtual + 1}/{qrs.length}</p>
              <img src={qrs[qrAtual]} alt={`QR ${qrAtual + 1}/${qrs.length}`} width={320} height={320} />
              <div className="acoes">
                <button disabled={qrAtual === 0} onClick={() => setQrAtual(qrAtual - 1)}>Anterior</button>
                <button disabled={qrAtual === qrs.length - 1} onClick={() => setQrAtual(qrAtual + 1)}>Próximo</button>
              </div>
            </div>
          )}
        </div>
      )}
      {aba === "ICS 309" && (
        <div>
          <button className="primario" onClick={pdf}>Baixar ICS 309 (PDF)</button>
          {erroPdf && <div role="alert"><p className="erro">{erroPdf}</p><button onClick={csv}>Gerar CSV</button></div>}
        </div>
      )}
    </section>
  );
}
