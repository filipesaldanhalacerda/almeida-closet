// Planilha Excel do Almeida Closet, mesmo formato da planilha original do
// gestor (abas Receita, Despesa, DRE, Fluxo de Caixa, Resultado de Vendas,
// Investimento e Devolução), com identidade da loja: faixa-título em cada aba,
// cabeçalhos estilizados, zebra, totais e impressão configurada.
import ExcelJS from "exceljs";
import { calcularCapital } from "@/lib/calc/capital";
import { calcularDre, type DreGrupoAgg, type DreModel } from "@/lib/calc/dre";
import { calcularResultadoVendas } from "@/lib/calc/resultado";
import {
  FORMA_LABEL,
  MEIO_LABEL,
  MESES_ABBR,
  MODALIDADE_LABEL,
} from "@/lib/constants";
import { isoParaBR } from "@/lib/format";
import type { LancamentoView } from "@/lib/types";
import { TODAS_ABAS, type AbaKey, type ExportParams } from "./tipos";

const MOEDA = '"R$" #,##0.00';

// Paleta (ARGB), mesmos tokens do app
const INK = "FF1C1A17";
const INK2 = "FF42403B";
const BRANCO = "FFFFFFFF";
const PANEL = "FFF3F1EC";
const PANEL2 = "FFEFECE5";
const ZEBRA = "FFFAF9F6";
const LINHA = "FFE6E2DA";
const VENDA = "FF2F7D5B";
const RECEB = "FF2B6F74";
const DESP = "FFB04A34";
const CAPITAL = "FF8C6F52";
const VERMELHO = "FFB04A34";

// Linha em que fica o cabeçalho das colunas (1=loja, 2=subtítulo, 3=respiro)
const HEAD = 4;

export type { ExportParams };

/** Contagem de linhas por seção (prévia da tela de Relatórios). */
export function contarLinhas(p: ExportParams): Record<AbaKey, number> {
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const receita = p.lancamentos.filter(
    (l) => (l.tipo === "venda" || l.tipo === "recebimento") && noRange(l.data),
  ).length;
  const despesa = p.lancamentos.filter((l) => l.tipo === "despesa" && noRange(l.data)).length;
  const capital = p.lancamentos.filter(
    (l) => l.tipo === "investimento" || l.tipo === "devolucao_capital",
  ).length;
  const fluxoDias = new Set(
    p.lancamentos
      .filter((l) => l.tipo === "recebimento" || l.tipo === "despesa" || l.tipo === "devolucao_capital")
      .map((l) => (l.tipo === "despesa" ? l.data_pagamento || l.data : l.data))
      .filter((d) => d >= p.desde && d <= p.ate),
  ).size;
  const vendedoras = new Set(
    p.lancamentos
      .filter((l) => l.tipo === "venda" && Number(l.data.slice(0, 4)) === p.ano)
      .map((l) => l.vendedora_id || l.criado_por),
  ).size;
  return { receita, despesa, dre: 12, fluxo: fluxoDias, resultado: vendedoras, capital };
}

// ---- helpers de estilo -------------------------------------------------------
function solid(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function bordaFina(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: LINHA } },
    bottom: { style: "thin", color: { argb: LINHA } },
    left: { style: "thin", color: { argb: LINHA } },
    right: { style: "thin", color: { argb: LINHA } },
  };
}

/** Faixa-título da loja + subtítulo com período, no topo da aba. */
function tituloAba(
  ws: ExcelJS.Worksheet,
  titulo: string,
  periodo: string,
  numCols: number,
  corTab: string,
) {
  ws.properties.tabColor = { argb: corTab };

  ws.mergeCells(1, 1, 1, numCols);
  const loja = ws.getCell(1, 1);
  loja.value = "ALMEIDA CLOSET";
  loja.font = { bold: true, size: 15, color: { argb: BRANCO }, name: "Calibri" };
  loja.fill = solid(INK);
  loja.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, numCols);
  const sub = ws.getCell(2, 1);
  sub.value = `Gestão de Lançamentos   ·   ${titulo}   ·   ${periodo}`;
  sub.font = { bold: true, size: 10, color: { argb: INK2 } };
  sub.fill = solid(PANEL);
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 18;

  ws.getRow(3).height = 6;
}

/** Cabeçalho de colunas estilizado. */
function headerColunas(ws: ExcelJS.Worksheet, labels: string[], row = HEAD) {
  const r = ws.getRow(row);
  labels.forEach((label, i) => {
    const c = r.getCell(i + 1);
    c.value = label;
    c.font = { bold: true, size: 9, color: { argb: INK2 } };
    c.fill = solid(PANEL2);
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", wrapText: true };
    bordaFina(c);
  });
  r.height = 20;
}

/** Zebra + bordas nas linhas de dados. */
function estilizaDados(ws: ExcelJS.Worksheet, deRow: number, ateRow: number, numCols: number) {
  for (let rn = deRow; rn <= ateRow; rn++) {
    const r = ws.getRow(rn);
    const zebra = (rn - deRow) % 2 === 1;
    for (let cn = 1; cn <= numCols; cn++) {
      const c = r.getCell(cn);
      if (zebra && !c.fill) c.fill = solid(ZEBRA);
      bordaFina(c);
      if (!c.font) c.font = { size: 9.5 };
    }
  }
}

/** Linha de total destacada. */
function linhaTotal(ws: ExcelJS.Worksheet, row: number, numCols: number) {
  const r = ws.getRow(row);
  for (let cn = 1; cn <= numCols; cn++) {
    const c = r.getCell(cn);
    c.fill = solid(PANEL2);
    c.font = { ...(c.font || {}), bold: true, size: 10 };
    c.border = {
      top: { style: "double", color: { argb: INK } },
      bottom: { style: "thin", color: { argb: LINHA } },
      left: { style: "thin", color: { argb: LINHA } },
      right: { style: "thin", color: { argb: LINHA } },
    };
  }
  r.height = 18;
}

/** Rótulo de bloco dentro da aba (ex.: "VENDAS POR MODALIDADE"). */
function rotuloBloco(ws: ExcelJS.Worksheet, row: number, numCols: number, texto: string, cor: string) {
  ws.mergeCells(row, 1, row, numCols);
  const c = ws.getCell(row, 1);
  c.value = texto;
  c.font = { bold: true, size: 10, color: { argb: cor } };
  c.fill = solid(PANEL);
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(row).height = 18;
}

/** Impressão: ajusta à largura, margens e rodapé com a marca. */
function setupImpressao(ws: ExcelJS.Worksheet, paisagem = false) {
  ws.pageSetup = {
    orientation: paisagem ? "landscape" : "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.55, header: 0.2, footer: 0.25 },
  };
  ws.headerFooter = {
    oddFooter: "&L&8Almeida Closet · Gestão de Lançamentos&R&8Página &P de &N",
  };
}

// ---- Fluxo diário para um intervalo (mesma regra do relatório) --------------
function fluxoRange(lancamentos: LancamentoView[], p: ExportParams) {
  const base = p.config?.saldo_inicial_data ?? null;
  const saldoInicial = Number(p.config?.saldo_inicial_caixa ?? 0);

  function afeta(l: LancamentoView): { data: string | null; entrada: number; saida: number } {
    if (l.tipo === "recebimento") return { data: l.data, entrada: Number(l.valor), saida: 0 };
    if (l.tipo === "despesa") return { data: l.data_pagamento || l.data, entrada: 0, saida: Number(l.valor) };
    if (l.tipo === "devolucao_capital") return { data: l.data, entrada: 0, saida: Number(l.valor) };
    return { data: null, entrada: 0, saida: 0 };
  }

  let saldoAntes = saldoInicial;
  const mapa = new Map<string, { entradas: number; saidas: number }>();
  for (const l of lancamentos) {
    const { data, entrada, saida } = afeta(l);
    if (!data) continue;
    if (base && data < base) continue;
    if (data < p.desde) saldoAntes += entrada - saida;
    else if (data <= p.ate) {
      if (!mapa.has(data)) mapa.set(data, { entradas: 0, saidas: 0 });
      const g = mapa.get(data)!;
      g.entradas += entrada;
      g.saidas += saida;
    }
  }
  const dias = [...mapa.keys()].sort();
  let saldo = saldoAntes;
  const linhas = dias.map((dia) => {
    const g = mapa.get(dia)!;
    const saldoDia = g.entradas - g.saidas;
    saldo += saldoDia;
    return { dia, entradas: g.entradas, saidas: g.saidas, saldoDia, saldoFinal: saldo };
  });
  return { saldoAntes, linhas };
}

function flattenDre(model: DreModel): { conta: string; nivel: number; sub: boolean; meses: number[]; total: number }[] {
  const out: { conta: string; nivel: number; sub: boolean; meses: number[]; total: number }[] = [];
  const grupo = (g: DreGrupoAgg) => {
    out.push({ conta: g.label, nivel: 0, sub: false, meses: g.meses, total: g.total });
    for (const c of g.children) out.push({ conta: c.nome, nivel: 1, sub: false, meses: c.meses, total: c.total });
  };
  grupo(model.receitaBruta);
  grupo(model.deducoes);
  out.push({ conta: model.receitaLiquida.label, nivel: 0, sub: true, meses: model.receitaLiquida.meses, total: model.receitaLiquida.total });
  grupo(model.custosVariaveis);
  out.push({ conta: model.margemContribuicao.label, nivel: 0, sub: true, meses: model.margemContribuicao.meses, total: model.margemContribuicao.total });
  grupo(model.despesasAdministrativas);
  grupo(model.despesasFuncionarios);
  grupo(model.despesasFinanceiras);
  out.push({ conta: model.resultadoOperacional.label, nivel: 0, sub: true, meses: model.resultadoOperacional.meses, total: model.resultadoOperacional.total });
  grupo(model.investimentos);
  grupo(model.dividas);
  out.push({ conta: model.resultadoFinal.label, nivel: 0, sub: true, meses: model.resultadoFinal.meses, total: model.resultadoFinal.total });
  return out;
}

// ---- geração -----------------------------------------------------------------
export async function gerarWorkbook(
  p: ExportParams,
  abas: AbaKey[] = TODAS_ABAS,
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Almeida Closet";
  wb.created = new Date(p.ate + "T12:00:00");

  const periodo = `${isoParaBR(p.desde)} a ${isoParaBR(p.ate)}`;
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const incluir = (k: AbaKey) => abas.includes(k);

  // ---------- Aba Receita ----------
  if (incluir("receita")) {
    const ws = wb.addWorksheet("Receita", { views: [{ state: "frozen", ySplit: HEAD }] });
    const N = 7;
    ws.columns = [
      { key: "desc", width: 27 },
      { key: "dv", width: 14 },
      { key: "dr", width: 16 },
      { key: "cli", width: 24 },
      { key: "valor", width: 14 },
      { key: "vend", width: 20 },
      { key: "mod", width: 16 },
    ] as Partial<ExcelJS.Column>[];
    tituloAba(ws, "Receita", periodo, N, VENDA);
    headerColunas(ws, [
      "Descrição da Receita",
      "Data da Venda",
      "Data do Recebimento",
      "Detalhamento (Cliente)",
      "Valor",
      "Vendedora Responsável",
      "Modalidade de Venda",
    ]);

    const itens = p.lancamentos
      .filter((l) => (l.tipo === "venda" || l.tipo === "recebimento") && noRange(l.data))
      .sort((a, b) => a.data.localeCompare(b.data));
    for (const l of itens) {
      const venda = l.tipo === "venda";
      const row = ws.addRow({
        desc: venda
          ? `Venda - ${l.forma_pagamento ? FORMA_LABEL[l.forma_pagamento] : ""}`
          : `Recebimento - ${l.meio ? MEIO_LABEL[l.meio] : ""}`,
        dv: venda ? isoParaBR(l.data) : "",
        dr: venda ? "" : isoParaBR(l.data),
        cli: venda ? l.cliente : l.cliente_ou_bandeira,
        valor: Number(l.valor),
        vend: l.vendedora_nome || l.criado_por_nome || "",
        mod: venda && l.modalidade ? MODALIDADE_LABEL[l.modalidade] : "",
      });
      row.getCell("valor").numFmt = MOEDA;
      row.getCell("valor").font = { size: 9.5, color: { argb: venda ? VENDA : RECEB } };
      ["dv", "dr", "mod"].forEach((k) => (row.getCell(k).alignment = { horizontal: "center" }));
    }
    estilizaDados(ws, HEAD + 1, ws.rowCount, N);
    if (ws.rowCount > HEAD) {
      const tot = ws.addRow({ desc: "TOTAL", valor: { formula: `SUM(E${HEAD + 1}:E${ws.rowCount})` } });
      tot.getCell("valor").numFmt = MOEDA;
      linhaTotal(ws, tot.number, N);
    }
    ws.autoFilter = { from: { row: HEAD, column: 1 }, to: { row: HEAD, column: N } };
    setupImpressao(ws);
  }

  // ---------- Aba Despesa ----------
  if (incluir("despesa")) {
    const ws = wb.addWorksheet("Despesa", { views: [{ state: "frozen", ySplit: HEAD }] });
    const N = 5;
    ws.columns = [
      { key: "desc", width: 28 },
      { key: "venc", width: 16 },
      { key: "pag", width: 16 },
      { key: "credor", width: 30 },
      { key: "valor", width: 15 },
    ] as Partial<ExcelJS.Column>[];
    tituloAba(ws, "Despesa", periodo, N, DESP);
    headerColunas(ws, [
      "Categoria",
      "Data de Vencimento",
      "Data do Pagamento",
      "Detalhamento (Credor)",
      "Valor",
    ]);

    const itens = p.lancamentos
      .filter((l) => l.tipo === "despesa" && noRange(l.data))
      .sort((a, b) => a.data.localeCompare(b.data));
    for (const l of itens) {
      const row = ws.addRow({
        desc: l.categoria_nome || "Despesa",
        venc: isoParaBR(l.data_vencimento),
        pag: isoParaBR(l.data_pagamento || l.data),
        credor: l.credor || "",
        valor: Number(l.valor),
      });
      row.getCell("valor").numFmt = MOEDA;
      row.getCell("valor").font = { size: 9.5, color: { argb: DESP } };
      ["venc", "pag"].forEach((k) => (row.getCell(k).alignment = { horizontal: "center" }));
    }
    estilizaDados(ws, HEAD + 1, ws.rowCount, N);
    if (ws.rowCount > HEAD) {
      const tot = ws.addRow({ desc: "TOTAL", valor: { formula: `SUM(E${HEAD + 1}:E${ws.rowCount})` } });
      tot.getCell("valor").numFmt = MOEDA;
      linhaTotal(ws, tot.number, N);
    }
    ws.autoFilter = { from: { row: HEAD, column: 1 }, to: { row: HEAD, column: N } };
    setupImpressao(ws);
  }

  // ---------- Aba DRE ----------
  if (incluir("dre")) {
    const ws = wb.addWorksheet("DRE", {
      views: [{ state: "frozen", xSplit: 1, ySplit: HEAD }],
    });
    const N = 14;
    ws.getColumn(1).width = 32;
    for (let i = 2; i <= 13; i++) ws.getColumn(i).width = 12;
    ws.getColumn(14).width = 14;
    tituloAba(ws, `Demonstração do Resultado (DRE) · Ano ${p.ano}`, periodo, N, CAPITAL);
    headerColunas(ws, ["Conta", ...MESES_ABBR, "Total"]);

    const dre = calcularDre(p.lancamentos, p.ano);
    for (const linha of flattenDre(dre)) {
      const row = ws.addRow([linha.conta, ...linha.meses, linha.total]);
      row.getCell(1).alignment = { indent: linha.nivel === 1 ? 2 : 0 };
      for (let cn = 2; cn <= N; cn++) {
        const c = row.getCell(cn);
        c.numFmt = MOEDA;
        c.font = { size: 9, bold: linha.nivel === 0 };
        const v = cn === N ? linha.total : linha.meses[cn - 2];
        if (v < 0) c.font = { ...c.font, color: { argb: VERMELHO } };
      }
      row.getCell(1).font = { size: 9.5, bold: linha.nivel === 0 };
      if (linha.sub) {
        for (let cn = 1; cn <= N; cn++) row.getCell(cn).fill = solid(PANEL2);
      }
      for (let cn = 1; cn <= N; cn++) bordaFina(row.getCell(cn));
    }
    setupImpressao(ws, true);
  }

  // ---------- Aba Fluxo de Caixa ----------
  if (incluir("fluxo")) {
    const ws = wb.addWorksheet("Fluxo de Caixa", { views: [{ state: "frozen", ySplit: HEAD }] });
    const N = 5;
    ws.columns = [
      { key: "data", width: 16 },
      { key: "entrada", width: 16 },
      { key: "saida", width: 16 },
      { key: "saldoDia", width: 16 },
      { key: "saldoFinal", width: 17 },
    ] as Partial<ExcelJS.Column>[];
    tituloAba(ws, "Fluxo de Caixa", periodo, N, RECEB);
    headerColunas(ws, ["Data", "Entradas", "Saídas", "Saldo do Dia", "Saldo Final"]);

    const fx = fluxoRange(p.lancamentos, p);
    const ini = ws.addRow({ data: "Saldo inicial", saldoFinal: fx.saldoAntes });
    ini.font = { italic: true, size: 9.5 };
    ini.getCell("saldoFinal").numFmt = MOEDA;
    let totE = 0;
    let totS = 0;
    for (const d of fx.linhas) {
      totE += d.entradas;
      totS += d.saidas;
      const row = ws.addRow({
        data: isoParaBR(d.dia),
        entrada: d.entradas,
        saida: d.saidas,
        saldoDia: d.saldoDia,
        saldoFinal: d.saldoFinal,
      });
      (["entrada", "saida", "saldoDia", "saldoFinal"] as const).forEach((k) => {
        row.getCell(k).numFmt = MOEDA;
      });
      row.getCell("data").alignment = { horizontal: "center" };
      row.getCell("entrada").font = { size: 9.5, color: { argb: VENDA } };
      row.getCell("saida").font = { size: 9.5, color: { argb: DESP } };
      if (d.saldoFinal < 0) row.getCell("saldoFinal").font = { size: 9.5, bold: true, color: { argb: VERMELHO } };
    }
    estilizaDados(ws, HEAD + 1, ws.rowCount, N);
    const tot = ws.addRow({
      data: "TOTAL",
      entrada: totE,
      saida: totS,
      saldoDia: totE - totS,
      saldoFinal: fx.linhas.length ? fx.linhas[fx.linhas.length - 1].saldoFinal : fx.saldoAntes,
    });
    (["entrada", "saida", "saldoDia", "saldoFinal"] as const).forEach((k) => (tot.getCell(k).numFmt = MOEDA));
    linhaTotal(ws, tot.number, N);
    setupImpressao(ws);
  }

  // ---------- Aba Resultado de Vendas ----------
  if (incluir("resultado")) {
    const ws = wb.addWorksheet("Resultado de Vendas", {
      views: [{ state: "frozen", ySplit: HEAD + 1 }],
    });
    const N = 15;
    ws.getColumn(1).width = 22;
    for (let i = 2; i <= 13; i++) ws.getColumn(i).width = 11;
    ws.getColumn(14).width = 13;
    ws.getColumn(15).width = 9;
    tituloAba(ws, `Resultado de Vendas · Ano ${p.ano}`, periodo, N, RECEB);

    const rv = calcularResultadoVendas(p.lancamentos, p.ano);
    rotuloBloco(ws, HEAD, N, "VENDAS MENSAIS POR VENDEDORA", INK2);
    headerColunas(ws, ["Vendedora", ...MESES_ABBR, "Total", "% Part."], HEAD + 1);
    for (const v of rv.vendedoras) {
      const row = ws.addRow([v.nome, ...v.meses, v.total, v.pct / 100]);
      for (let i = 2; i <= 14; i++) row.getCell(i).numFmt = MOEDA;
      row.getCell(15).numFmt = "0.0%";
    }
    estilizaDados(ws, HEAD + 2, ws.rowCount, N);
    const totMeses = Array.from({ length: 12 }, (_, i) =>
      rv.vendedoras.reduce((s, v) => s + v.meses[i], 0),
    );
    const totRow = ws.addRow(["TOTAL", ...totMeses, rv.totalAno, 1]);
    for (let i = 2; i <= 14; i++) totRow.getCell(i).numFmt = MOEDA;
    totRow.getCell(15).numFmt = "0%";
    linhaTotal(ws, totRow.number, N);

    ws.addRow([]);
    const rMod = ws.rowCount + 1;
    rotuloBloco(ws, rMod, 4, "VENDAS POR MODALIDADE", INK2);
    headerColunas(ws, ["Modalidade", "Valor", "% Part.", ""], rMod + 1);
    for (const m of rv.modalidades) {
      const row = ws.addRow([m.label, m.valor, m.pct / 100]);
      row.getCell(2).numFmt = MOEDA;
      row.getCell(3).numFmt = "0.0%";
      for (let cn = 1; cn <= 3; cn++) bordaFina(row.getCell(cn));
      row.font = { size: 9.5 };
    }
    setupImpressao(ws, true);
  }

  // ---------- Aba Investimento e Devolução ----------
  if (incluir("capital")) {
    const ws = wb.addWorksheet("Investimento e Devolução");
    const N = 4;
    ws.getColumn(1).width = 34;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 15;
    ws.getColumn(4).width = 16;
    tituloAba(ws, "Investimento e Devolução de Capital", "histórico completo", N, CAPITAL);

    const cap = calcularCapital(p.lancamentos);

    rotuloBloco(ws, HEAD, N, "INVESTIMENTO (APORTES)", VENDA);
    headerColunas(ws, ["Descrição", "Data", "Valor", "Acumulado"], HEAD + 1);
    for (const a of cap.aportes) {
      const row = ws.addRow([a.desc, isoParaBR(a.data), a.valor, a.acumulado]);
      row.getCell(3).numFmt = MOEDA;
      row.getCell(4).numFmt = MOEDA;
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).font = { size: 9.5, color: { argb: VENDA } };
    }
    estilizaDados(ws, HEAD + 2, ws.rowCount, N);
    const totAp = ws.addRow(["TOTAL DE APORTES", "", cap.totalAportes, ""]);
    totAp.getCell(3).numFmt = MOEDA;
    linhaTotal(ws, totAp.number, N);

    ws.addRow([]);
    const rDev = ws.rowCount + 1;
    rotuloBloco(ws, rDev, N, "DEVOLUÇÃO DE CAPITAL (RETIRADAS)", DESP);
    headerColunas(ws, ["Descrição", "Data", "Valor", "Acumulado"], rDev + 1);
    const inicioDev = ws.rowCount + 1;
    for (const d of cap.devolucoes) {
      const row = ws.addRow([d.desc, isoParaBR(d.data), d.valor, d.acumulado]);
      row.getCell(3).numFmt = MOEDA;
      row.getCell(4).numFmt = MOEDA;
      row.getCell(2).alignment = { horizontal: "center" };
      row.getCell(3).font = { size: 9.5, color: { argb: DESP } };
    }
    estilizaDados(ws, inicioDev, ws.rowCount, N);
    const totDev = ws.addRow(["TOTAL DE DEVOLUÇÕES", "", cap.totalDevolucoes, ""]);
    totDev.getCell(3).numFmt = MOEDA;
    linhaTotal(ws, totDev.number, N);

    ws.addRow([]);
    const liq = ws.addRow(["CAPITAL LÍQUIDO INVESTIDO", "", cap.liquido, ""]);
    liq.getCell(3).numFmt = MOEDA;
    liq.font = { bold: true, size: 11 };
    liq.getCell(1).font = { bold: true, size: 10.5 };
    for (let cn = 1; cn <= N; cn++) {
      liq.getCell(cn).fill = solid(PANEL);
      bordaFina(liq.getCell(cn));
    }
    setupImpressao(ws);
  }

  return wb.xlsx.writeBuffer();
}
