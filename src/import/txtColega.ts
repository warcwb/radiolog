import { indicativoEstrangeiro, indicativoValido, normalizarIndicativo, semelhantes } from "../domain/callsign";
import { detectarSensivel } from "../domain/sensitive";
import { horaDigitadaParaIso } from "../domain/time";
import type { Entrada, Estacao, TipoEntrada } from "../domain/types";
import type { Aviso, ImportPreview, LinhaPreview } from "./preview";

const RE_ENTRADA = /^(\d{1,2}:\d{2})\s+(\S+)\s*(.*)$/;
const RE_NOME = /^[A-ZÀ-Ú][a-zà-ú]+$/;
const RE_AMBIGUO = /\b(maioria|quase todos|maior parte)\b/i;

/** Interpreta o log em .txt no formato do colega (ver docs/referencias). Nada é descartado. */
export function interpretarTxtColega(texto: string, operador: string): ImportPreview {
  const op: ImportPreview["operacao"] = {};
  const estacaoLog = { indicativo: "", equipamento: "", potencia: "", antena: "", grid: "" };
  const equipamentos: string[] = [];
  const estacoes: Estacao[] = [];
  const entradas: Omit<Entrada, "operacaoId">[] = [];
  const linhas: LinhaPreview[] = [];
  const pendenciasSugeridas: ImportPreview["pendenciasSugeridas"] = [];
  let data = "";
  let zonaEquipamento = false;
  let ultimaHora = "";

  const acrescentar = (numero: number, original: string, e: Omit<Entrada, "operacaoId" | "seq">, avisos: Aviso[], naoReconhecida = false) => {
    entradas.push({ ...e, seq: entradas.length + 1 });
    linhas.push({ numero, original, avisos, entradaIndice: entradas.length - 1, status: naoReconhecida ? "NAO_RECONHECIDA" : avisos.length ? "AVISO" : "OK" });
  };
  const base = (tipo: TipoEntrada, de: string, txt: string, hora: string, horaDesconhecida: boolean): Omit<Entrada, "operacaoId" | "seq"> => ({
    hora, horaRegistro: hora, horaDesconhecida, operador, tipo, de, para: estacaoLog.indicativo || operador,
    local: "", grid: "", precedencia: "ROTINA", teste: false, numMensagem: "", texto: txt,
    sensivel: detectarSensivel(txt), posEncerramento: false, origem: "IMPORTADO",
  });
  const observacao = (numero: number, original: string, txt: string, naoReconhecida: boolean) => {
    const avisos: Aviso[] = [{ codigo: "SEM_HORA", texto: "Linha sem hora registrada" }];
    if (RE_AMBIGUO.test(txt)) {
      avisos.push({ codigo: "AMBIGUO_SEGURANCA", texto: "Frase de segurança ambígua: confirme quantas pessoas ficaram sem confirmação" });
      pendenciasSugeridas.push({ estacao: "", texto: txt });
    }
    acrescentar(numero, original, base("OBSERVACAO", "", txt, ultimaHora || op.inicio || `${data}T00:00:00.000Z`, true), avisos, naoReconhecida);
  };

  texto.split(/\r?\n/).forEach((bruta, i) => {
    const numero = i + 1;
    const l = bruta.trim();
    if (!l) return;
    let m: RegExpExecArray | null;

    if ((m = /QRG\s*([\d.,]+)\s*MHz/i.exec(l)) && !entradas.length) { op.frequencia = `${m[1]?.replace(",", ".")} MHz`; op.nome = l; return; }
    if ((m = /^(\d{4})[.\-/](\d{2})[.\-/](\d{2})$/.exec(l)) || (m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(l))) {
      data = m[1]!.length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2]}-${m[1]}`;
      op.data = data;
      return;
    }
    if ((m = /Disponibilidade.*?(\d{1,2}:\d{2}).*?(\d{1,2}:\d{2})/i.exec(l))) {
      op.inicio = horaDigitadaParaIso(m[1]!, data, "");
      const fim = horaDigitadaParaIso(m[2]!, data, "");
      op.fim = fim < op.inicio ? new Date(new Date(fim).getTime() + 864e5).toISOString() : fim;
      return;
    }
    if ((m = /^Grid\s*Locator\s*:?\s*(\S+)/i.exec(l))) { estacaoLog.grid = m[1]!; zonaEquipamento = true; return; }
    if ((m = /^(Adjunto|NCS)\s+(\S+)\s*(?:-\s*(.*))?$/i.exec(l))) {
      const pessoa = { indicativo: normalizarIndicativo(m[2]!), nome: "" };
      if (m[1]!.toLowerCase() === "ncs") op.ncs = pessoa; else op.adjunto = pessoa;
      estacaoLog.indicativo = pessoa.indicativo;
      if (m[3]) op.rede = m[3].trim();
      zonaEquipamento = false;
      return;
    }
    if ((m = /^-\s*Via\s+(\S+)/i.exec(l))) { op.repetidora = m[1]!; return; }
    if (l.startsWith("-")) { observacao(numero, bruta, l.replace(/^-\s*/, ""), false); return; }

    m = RE_ENTRADA.exec(l);
    if (!m) {
      if (zonaEquipamento && !entradas.length) {
        if (/^\d+\s?W$/i.test(l)) estacaoLog.potencia = l.replace(/\s/g, "").toUpperCase();
        else equipamentos.push(l);
        return;
      }
      observacao(numero, bruta, l, true);
      return;
    }

    const [, hhmm, token, restoBruto] = m as unknown as [string, string, string, string];
    const avisos: Aviso[] = [];
    const ref = ultimaHora || op.inicio || "";
    const hora = horaDigitadaParaIso(hhmm, data, ref);
    if (ultimaHora && hora < ultimaHora) avisos.push({ codigo: "HORA_RETROCEDE", texto: "Hora anterior à da linha de cima" });
    if (op.inicio && op.fim && (hora < op.inicio || hora > op.fim)) avisos.push({ codigo: "FORA_PERIODO", texto: "Hora fora do período da operação" });
    ultimaHora = hora;

    const qsa = /QSA-(\d)/i.exec(restoBruto)?.[1];
    const qrk = /QRK-(\d)/i.exec(restoBruto)?.[1];
    const resto = restoBruto.replace(/QSA-\d|QRK-\d/gi, "").trim().replace(/^-\s*/, "");
    const segmentos = resto ? resto.split(/\s+-\s+/).map((s) => s.trim()) : [];
    const sinal = { ...(qsa ? { qsa: Number(qsa) } : {}), ...(qrk ? { qrk: Number(qrk) } : {}) };

    if (token.includes("?")) {
      avisos.push({ codigo: "NAO_IDENTIFICADA", texto: "Estação não identificada" });
      acrescentar(numero, bruta, { ...base("NAO_IDENTIFICADA", token, segmentos.join(" - "), hora, false), ...sinal }, avisos);
      return;
    }
    const valido = indicativoValido(token);
    const estrangeiro = !valido && indicativoEstrangeiro(token);
    if (!valido && !estrangeiro && !/^[\p{L}\d]+$/u.test(token)) { observacao(numero, bruta, l, true); return; }
    if (estrangeiro) avisos.push({ codigo: "ESTRANGEIRO", texto: "Indicativo estrangeiro" });
    const chave = valido || estrangeiro ? normalizarIndicativo(token) : token.toUpperCase();

    if (chave === estacaoLog.indicativo || (!estacaoLog.indicativo && chave === normalizarIndicativo(operador))) {
      const tipo = /QRV/i.test(resto) ? "IDENTIFICACAO" : "TRAFEGO";
      acrescentar(numero, bruta, { ...base(tipo, chave, segmentos.join(" - "), hora, false), ...sinal }, avisos);
      return;
    }

    let est = estacoes.find((e) => e.chave === chave);
    const nova = !est;
    if (!est) {
      const parecida = estacoes.find((e) => semelhantes(e.chave, chave));
      if (parecida) avisos.push({ codigo: "SEMELHANTE", texto: `Parecido com ${parecida.chave}: é a mesma estação?` });
      est = { operacaoId: "", chave, indicativo: valido || estrangeiro ? chave : "", tatico: valido || estrangeiro ? "" : token, nome: "", equipamento: "", local: "", grid: "", funcao: "FIXA" };
      estacoes.push(est);
    }
    const primeiro = segmentos[0];
    if (primeiro && RE_NOME.test(primeiro) && (!est.nome || est.nome === primeiro)) {
      est.nome = primeiro;
      segmentos.shift();
    }
    acrescentar(numero, bruta, { ...base(nova ? "ENTRADA_REDE" : "SITUACAO", chave, segmentos.join(" - "), hora, false), ...sinal }, avisos);
  });

  estacaoLog.equipamento = equipamentos.join("; ");
  op.estacaoLog = estacaoLog;

  const semSaida = estacoes.filter((e) => !entradas.some((x) => x.de === e.chave && x.tipo === "SAIDA")).map((e) => e.chave);
  const resumo: Aviso[] = semSaida.length
    ? [{ codigo: "SEM_SAIDA", texto: `${semSaida.length} estações sem SAÍDA registrada: ${semSaida.join(", ")}` }]
    : [];
  linhas.unshift({ numero: 0, original: "Resumo da importação", status: resumo.length ? "AVISO" : "OK", avisos: resumo });
  return { operacao: op, estacoes, entradas, linhas, pendenciasSugeridas };
}
