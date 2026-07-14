// Relatório em PDF do Almeida Closet, layout profissional com a identidade
// do sistema: capa com resumo, seções com tabelas zebradas, DRE e Resultado
// de Vendas em paisagem, rodapé com paginação. Gerado com pdfkit (fontes
// padrão Helvetica, WinAnsi, pt-BR ok).
import PDFDocument from "pdfkit";
import { calcularCapital } from "@/lib/calc/capital";
import { calcularDre, type DreGrupoAgg, type DreModel, type DreSubtotal } from "@/lib/calc/dre";
import { calcularResultadoVendas } from "@/lib/calc/resultado";
import { FORMA_LABEL, MEIO_LABEL, MESES_ABBR, MODALIDADE_LABEL } from "@/lib/constants";
import { brl, fmtInt, isoParaBR, pct } from "@/lib/format";
import type { Configuracao, LancamentoView } from "@/lib/types";
import type { AbaKey, ExportParams } from "./tipos";

// ---- tokens ----------------------------------------------------------------
const INK = "#1c1a17";
const INK2 = "#42403b";
const MUTED = "#8a857c";
const FAINT = "#a09a90";
const LINE = "#ece7df";
const PANEL = "#faf9f6";
const PANEL2 = "#f3f1ec";
const VENDA = "#2f7d5b";
const RECEB = "#2b6f74";
const DESP = "#b04a34";
const CAPITAL = "#8c6f52";

const M = 40; // margem
const FOOTER_H = 34;

// Sanitiza para WinAnsi (fontes padrão do PDF)
function limpa(s: string): string {
  return (s || "")
    .replace(/−/g, "-") // sinal de menos matemático
    .replace(/[  ]/g, " "); // espaços especiais do Intl
}

interface Col {
  label: string;
  width: number;
  align?: "left" | "right";
}

interface Linha {
  cells: string[];
  bold?: boolean;
  bg?: string;
  /** cor por célula (null = padrão) */
  colors?: (string | null)[];
  indent?: boolean;
}

type Doc = PDFKit.PDFDocument;

function bottomY(doc: Doc): number {
  return doc.page.height - M - FOOTER_H;
}

function novaPagina(doc: Doc, layout: "portrait" | "landscape") {
  doc.addPage({ size: "A4", layout, margins: { top: M, bottom: M, left: M, right: M } });
}

/** Título de seção com marcador colorido e régua. */
function tituloSecao(doc: Doc, texto: string, cor: string, sub?: string) {
  let y = doc.y;
  const limite = bottomY(doc) - 80; // garante espaço para pelo menos o cabeçalho da tabela
  if (y > limite) {
    novaPagina(doc, doc.page.width > doc.page.height ? "landscape" : "portrait");
    y = doc.y;
  }
  y += 6;
  doc.rect(M, y + 2, 4, 14).fill(cor);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(INK)
    .text(limpa(texto), M + 12, y, { lineBreak: false });
  if (sub) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(FAINT)
      .text(limpa(sub), M + 12, y + 16, { lineBreak: false });
  }
  const fimY = y + (sub ? 28 : 22);
  doc
    .moveTo(M, fimY)
    .lineTo(doc.page.width - M, fimY)
    .lineWidth(0.7)
    .strokeColor(LINE)
    .stroke();
  doc.y = fimY + 8;
  doc.x = M;
}

/** Desenha uma tabela com cabeçalho repetido em quebras de página. */
function tabela(
  doc: Doc,
  cols: Col[],
  linhas: Linha[],
  opts: { fonte?: number; zebra?: boolean; layout?: "portrait" | "landscape" } = {},
) {
  const fonte = opts.fonte ?? 8;
  const zebra = opts.zebra ?? true;
  const layout = opts.layout ?? "portrait";
  const rowH = fonte + 8;
  const totalW = cols.reduce((s, c) => s + c.width, 0);

  const desenhaHeader = (y: number): number => {
    doc.rect(M, y, totalW, rowH + 2).fill(PANEL2);
    let x = M;
    doc.font("Helvetica-Bold").fontSize(fonte - 0.5).fillColor(INK2);
    for (const c of cols) {
      doc.text(limpa(c.label.toUpperCase()), x + 4, y + 4, {
        width: c.width - 8,
        align: c.align ?? "left",
        lineBreak: false,
      });
      x += c.width;
    }
    return y + rowH + 2;
  };

  let y = desenhaHeader(doc.y);
  linhas.forEach((linha, idx) => {
    if (y + rowH > bottomY(doc)) {
      novaPagina(doc, layout);
      y = desenhaHeader(M);
    }
    const bg = linha.bg ?? (zebra && idx % 2 === 1 ? PANEL : null);
    if (bg) doc.rect(M, y, totalW, rowH).fill(bg);
    let x = M;
    doc.font(linha.bold ? "Helvetica-Bold" : "Helvetica").fontSize(fonte);
    linha.cells.forEach((cell, i) => {
      const c = cols[i];
      doc.fillColor(linha.colors?.[i] ?? INK2);
      const extra = i === 0 && linha.indent ? 10 : 0;
      doc.text(limpa(cell), x + 4 + extra, y + 3.5, {
        width: c.width - 8 - extra,
        align: c.align ?? "left",
        lineBreak: false,
      });
      x += c.width;
    });
    doc
      .moveTo(M, y + rowH)
      .lineTo(M + totalW, y + rowH)
      .lineWidth(0.4)
      .strokeColor("#f2efe9")
      .stroke();
    y += rowH;
  });
  doc.y = y + 10;
  doc.x = M;
}

/** Linha de total destacada (borda superior + negrito). */
function linhaTotal(cells: string[], colors?: (string | null)[]): Linha {
  return { cells, bold: true, bg: PANEL2, colors };
}

// ---- capa / cabeçalho -------------------------------------------------------
function capa(doc: Doc, p: ExportParams, geradoEm: string) {
  // wordmark
  doc.font("Helvetica-Bold").fontSize(7).fillColor(FAINT);
  doc.text("G E S T Ã O   D E   L A N Ç A M E N T O S", M, M, { lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(24).fillColor(INK);
  doc.text("Almeida Closet", M, M + 12, { lineBreak: false });

  // bloco direito
  const wDir = 220;
  const xDir = doc.page.width - M - wDir;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(INK);
  doc.text("Relatório de Lançamentos", xDir, M + 2, { width: wDir, align: "right" });
  doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
  doc.text(limpa(`Período: ${isoParaBR(p.desde)} a ${isoParaBR(p.ate)}`), xDir, M + 18, {
    width: wDir,
    align: "right",
  });
  doc.text(limpa(`Gerado em ${geradoEm}`), xDir, M + 30, { width: wDir, align: "right" });

  // régua
  doc
    .moveTo(M, M + 46)
    .lineTo(doc.page.width - M, M + 46)
    .lineWidth(1.4)
    .strokeColor(INK)
    .stroke();

  // resumo do período
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const recebido = p.lancamentos
    .filter((l) => l.tipo === "recebimento" && noRange(l.data))
    .reduce((s, l) => s + l.valor, 0);
  const despesas = p.lancamentos
    .filter((l) => l.tipo === "despesa" && noRange(l.data))
    .reduce((s, l) => s + l.valor, 0);
  const vendasArr = p.lancamentos.filter((l) => l.tipo === "venda" && noRange(l.data));
  const vendas = vendasArr.reduce((s, l) => s + l.valor, 0);
  const resultado = recebido - despesas;

  const yBox = M + 58;
  const wBox = doc.page.width - M * 2;
  const hBox = 52;
  doc.roundedRect(M, yBox, wBox, hBox, 6).fill(PANEL);
  doc.roundedRect(M, yBox, wBox, hBox, 6).lineWidth(0.7).strokeColor(LINE).stroke();

  const stats: { rotulo: string; valor: string; cor: string }[] = [
    { rotulo: "RECEBIDO (CAIXA)", valor: brl(recebido), cor: VENDA },
    { rotulo: "DESPESAS", valor: brl(despesas), cor: DESP },
    { rotulo: "RESULTADO", valor: brl(resultado), cor: resultado < 0 ? DESP : INK },
    { rotulo: `VENDAS (${vendasArr.length})`, valor: brl(vendas), cor: RECEB },
  ];
  const wStat = wBox / stats.length;
  stats.forEach((s, i) => {
    const x = M + i * wStat + 14;
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(FAINT);
    doc.text(limpa(s.rotulo), x, yBox + 12, { lineBreak: false, characterSpacing: 0.8 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(s.cor);
    doc.text(limpa(s.valor), x, yBox + 24, { lineBreak: false });
    if (i > 0) {
      doc
        .moveTo(M + i * wStat, yBox + 10)
        .lineTo(M + i * wStat, yBox + hBox - 10)
        .lineWidth(0.6)
        .strokeColor(LINE)
        .stroke();
    }
  });

  doc.y = yBox + hBox + 16;
  doc.x = M;
}

// ---- seções -----------------------------------------------------------------
function secaoReceita(doc: Doc, p: ExportParams) {
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const itens = p.lancamentos
    .filter((l) => (l.tipo === "venda" || l.tipo === "recebimento") && noRange(l.data))
    .sort((a, b) => a.data.localeCompare(b.data));

  tituloSecao(doc, "Receita", VENDA, `${itens.length} ${itens.length === 1 ? "lançamento" : "lançamentos"} no período`);

  const cols: Col[] = [
    { label: "Descrição", width: 118 },
    { label: "Data venda", width: 54 },
    { label: "Data receb.", width: 56 },
    { label: "Cliente", width: 96 },
    { label: "Vendedora", width: 78 },
    { label: "Modalidade", width: 48 },
    { label: "Valor", width: 65, align: "right" },
  ];
  const linhas: Linha[] = itens.map((l) => {
    const venda = l.tipo === "venda";
    return {
      cells: [
        venda
          ? `Venda - ${l.forma_pagamento ? FORMA_LABEL[l.forma_pagamento] : ""}`
          : `Recebimento - ${l.meio ? MEIO_LABEL[l.meio] : ""}`,
        venda ? isoParaBR(l.data) : "",
        venda ? "" : isoParaBR(l.data),
        (venda ? l.cliente : l.cliente_ou_bandeira) || "",
        l.vendedora_nome || l.criado_por_nome || "",
        venda && l.modalidade ? MODALIDADE_LABEL[l.modalidade] : "",
        brl(l.valor),
      ],
      colors: [null, null, null, null, null, null, venda ? VENDA : RECEB],
    };
  });
  const somaVendas = itens.filter((l) => l.tipo === "venda").reduce((s, l) => s + l.valor, 0);
  const somaReceb = itens.filter((l) => l.tipo === "recebimento").reduce((s, l) => s + l.valor, 0);
  linhas.push(linhaTotal(["Total de vendas (volume)", "", "", "", "", "", brl(somaVendas)], [null, null, null, null, null, null, VENDA]));
  linhas.push(linhaTotal(["Total recebido (caixa)", "", "", "", "", "", brl(somaReceb)], [null, null, null, null, null, null, RECEB]));
  tabela(doc, cols, linhas, { fonte: 7.5 });
}

function secaoDespesa(doc: Doc, p: ExportParams) {
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const itens = p.lancamentos
    .filter((l) => l.tipo === "despesa" && noRange(l.data))
    .sort((a, b) => a.data.localeCompare(b.data));

  tituloSecao(doc, "Despesa", DESP, `${itens.length} ${itens.length === 1 ? "lançamento" : "lançamentos"} no período`);

  const cols: Col[] = [
    { label: "Categoria", width: 125 },
    { label: "Vencimento", width: 62 },
    { label: "Pagamento", width: 62 },
    { label: "Credor / detalhamento", width: 166 },
    { label: "Valor", width: 100, align: "right" },
  ];
  const linhas: Linha[] = itens.map((l) => ({
    cells: [
      l.categoria_nome || "Despesa",
      isoParaBR(l.data_vencimento),
      isoParaBR(l.data_pagamento || l.data),
      l.credor || "",
      brl(l.valor),
    ],
    colors: [null, null, null, null, DESP],
  }));
  const soma = itens.reduce((s, l) => s + l.valor, 0);
  linhas.push(linhaTotal(["Total de despesas", "", "", "", brl(soma)], [null, null, null, null, DESP]));
  tabela(doc, cols, linhas, { fonte: 7.5 });
}

function linhasDre(model: DreModel): Linha[] {
  const out: Linha[] = [];
  const numCell = (v: number) => (v === 0 ? "-" : fmtInt(v));
  const corCell = (v: number) => (v < 0 ? DESP : null);
  const pushGrupo = (g: DreGrupoAgg) => {
    out.push({
      cells: [g.label, ...g.meses.map(numCell), numCell(g.total)],
      bold: true,
      colors: [null, ...g.meses.map(corCell), corCell(g.total)],
    });
    for (const c of g.children) {
      out.push({
        cells: [c.nome, ...c.meses.map(numCell), numCell(c.total)],
        indent: true,
        colors: [null, ...c.meses.map(corCell), corCell(c.total)],
      });
    }
  };
  const pushSub = (s: DreSubtotal) => {
    out.push({
      cells: [s.label, ...s.meses.map(numCell), numCell(s.total)],
      bold: true,
      bg: PANEL2,
      colors: [null, ...s.meses.map(corCell), corCell(s.total)],
    });
  };
  pushGrupo(model.receitaBruta);
  pushGrupo(model.deducoes);
  pushSub(model.receitaLiquida);
  pushGrupo(model.custosVariaveis);
  pushSub(model.margemContribuicao);
  pushGrupo(model.despesasAdministrativas);
  pushGrupo(model.despesasFuncionarios);
  pushGrupo(model.despesasFinanceiras);
  pushSub(model.resultadoOperacional);
  pushGrupo(model.investimentos);
  pushGrupo(model.dividas);
  pushSub(model.resultadoFinal);
  return out;
}

function secaoDre(doc: Doc, p: ExportParams) {
  novaPagina(doc, "landscape");
  const model = calcularDre(p.lancamentos, p.ano);
  tituloSecao(
    doc,
    `DRE ${p.ano}`,
    CAPITAL,
    `Demonstração do resultado do exercício - valores em R$ - margem líquida ${pct(model.resumo.margemPct, 1)}`,
  );
  const mesW = 44;
  const cols: Col[] = [
    { label: "Conta", width: 150 },
    ...MESES_ABBR.map((m) => ({ label: m, width: mesW, align: "right" as const })),
    { label: "Total", width: 58, align: "right" },
  ];
  tabela(doc, cols, linhasDre(model), { fonte: 6.8, zebra: false, layout: "landscape" });
}

function secaoFluxo(doc: Doc, p: ExportParams) {
  // Mesma regra do relatório de tela / aba do Excel
  const base = p.config?.saldo_inicial_data ?? null;
  let saldo = Number(p.config?.saldo_inicial_caixa ?? 0);
  const mapa = new Map<string, { entradas: number; saidas: number }>();
  for (const l of p.lancamentos) {
    let data: string | null = null;
    let entrada = 0;
    let saida = 0;
    if (l.tipo === "recebimento") {
      data = l.data;
      entrada = l.valor;
    } else if (l.tipo === "despesa") {
      data = l.data_pagamento || l.data;
      saida = l.valor;
    } else if (l.tipo === "devolucao_capital") {
      data = l.data;
      saida = l.valor;
    }
    if (!data) continue;
    if (base && data < base) continue;
    if (data < p.desde) saldo += entrada - saida;
    else if (data <= p.ate) {
      if (!mapa.has(data)) mapa.set(data, { entradas: 0, saidas: 0 });
      const g = mapa.get(data)!;
      g.entradas += entrada;
      g.saidas += saida;
    }
  }
  const dias = [...mapa.keys()].sort();

  tituloSecao(doc, "Fluxo de Caixa", RECEB, `Saldo no início do período: ${limpa(brl(saldo))}`);

  const cols: Col[] = [
    { label: "Data", width: 75 },
    { label: "Entradas", width: 105, align: "right" },
    { label: "Saídas", width: 105, align: "right" },
    { label: "Saldo do dia", width: 110, align: "right" },
    { label: "Saldo final", width: 120, align: "right" },
  ];
  const linhas: Linha[] = [];
  let totalE = 0;
  let totalS = 0;
  for (const dia of dias) {
    const g = mapa.get(dia)!;
    const saldoDia = g.entradas - g.saidas;
    saldo += saldoDia;
    totalE += g.entradas;
    totalS += g.saidas;
    linhas.push({
      cells: [
        isoParaBR(dia),
        g.entradas ? brl(g.entradas) : "-",
        g.saidas ? brl(g.saidas) : "-",
        brl(saldoDia),
        brl(saldo),
      ],
      bg: saldo < 0 ? "#fbf1ee" : undefined,
      colors: [null, VENDA, DESP, saldoDia < 0 ? DESP : null, saldo < 0 ? DESP : null],
    });
  }
  linhas.push(
    linhaTotal(
      ["Total do período", brl(totalE), brl(totalS), brl(totalE - totalS), brl(saldo)],
      [null, VENDA, DESP, totalE - totalS < 0 ? DESP : null, saldo < 0 ? DESP : null],
    ),
  );
  tabela(doc, cols, linhas, { fonte: 8 });
}

function secaoResultado(doc: Doc, p: ExportParams) {
  novaPagina(doc, "landscape");
  const rv = calcularResultadoVendas(p.lancamentos, p.ano);
  tituloSecao(doc, `Resultado de Vendas ${p.ano}`, RECEB, "Vendas mensais por vendedora e participação no total do ano");

  const mesW = 44;
  const cols: Col[] = [
    { label: "Vendedora", width: 110 },
    ...MESES_ABBR.map((m) => ({ label: m, width: mesW, align: "right" as const })),
    { label: "Total", width: 62, align: "right" },
    { label: "% Part.", width: 42, align: "right" },
  ];
  const linhas: Linha[] = rv.vendedoras.map((v) => ({
    cells: [v.nome, ...v.meses.map((m) => (m === 0 ? "-" : fmtInt(m))), fmtInt(v.total), pct(v.pct, 1)],
  }));
  const totMeses = Array.from({ length: 12 }, (_, i) =>
    rv.vendedoras.reduce((s, v) => s + v.meses[i], 0),
  );
  linhas.push(
    linhaTotal(["Total", ...totMeses.map((m) => (m === 0 ? "-" : fmtInt(m))), fmtInt(rv.totalAno), "100%"]),
  );
  tabela(doc, cols, linhas, { fonte: 6.8, layout: "landscape" });

  // vendas por modalidade
  doc.y += 4;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
  doc.text("Vendas por modalidade", M, doc.y, { lineBreak: false });
  doc.y += 16;
  const colsMod: Col[] = [
    { label: "Modalidade", width: 180 },
    { label: "Valor", width: 120, align: "right" },
    { label: "Participação", width: 90, align: "right" },
  ];
  tabela(
    doc,
    colsMod,
    rv.modalidades.map((m) => ({ cells: [m.label, brl(m.valor), pct(m.pct, 1)] })),
    { fonte: 8, layout: "landscape" },
  );
}

function secaoCapital(doc: Doc, p: ExportParams) {
  const cap = calcularCapital(p.lancamentos);
  tituloSecao(doc, "Investimento e Devolução de Capital", CAPITAL, "Histórico completo, com valores acumulados");

  const cols: Col[] = [
    { label: "Descrição", width: 220 },
    { label: "Data", width: 75 },
    { label: "Valor", width: 105, align: "right" },
    { label: "Acumulado", width: 115, align: "right" },
  ];

  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(VENDA);
  doc.text("INVESTIMENTO (APORTES)", M, doc.y, { lineBreak: false, characterSpacing: 0.6 });
  doc.y += 14;
  const ap: Linha[] = cap.aportes.map((x) => ({
    cells: [x.desc, isoParaBR(x.data), brl(x.valor), brl(x.acumulado)],
    colors: [null, null, VENDA, null],
  }));
  ap.push(linhaTotal(["Total de aportes", "", brl(cap.totalAportes), ""], [null, null, VENDA, null]));
  tabela(doc, cols, ap, { fonte: 8 });

  doc.y += 2;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DESP);
  doc.text("DEVOLUÇÃO DE CAPITAL (RETIRADAS)", M, doc.y, { lineBreak: false, characterSpacing: 0.6 });
  doc.y += 14;
  const dev: Linha[] = cap.devolucoes.map((x) => ({
    cells: [x.desc, isoParaBR(x.data), brl(x.valor), brl(x.acumulado)],
    colors: [null, null, DESP, null],
  }));
  dev.push(linhaTotal(["Total de devoluções", "", brl(cap.totalDevolucoes), ""], [null, null, DESP, null]));
  tabela(doc, cols, dev, { fonte: 8 });

  doc.y += 2;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
  doc.text(limpa(`Capital líquido investido: ${brl(cap.liquido)}`), M, doc.y, { lineBreak: false });
  doc.y += 18;
}

// ---- geração ---------------------------------------------------------------
export async function gerarPdf(p: ExportParams, abas: AbaKey[]): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: M, bottom: M, left: M, right: M },
    bufferPages: true,
    info: {
      Title: `Relatório Almeida Closet ${isoParaBR(p.desde)} a ${isoParaBR(p.ate)}`,
      Author: "Almeida Closet - Gestão de Lançamentos",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const fim = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const agora = new Date();
  const geradoEm = `${agora.toLocaleDateString("pt-BR")} às ${agora
    .getHours()
    .toString()
    .padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}`;

  capa(doc, p, geradoEm);

  const ordem: { key: AbaKey; fn: (d: Doc, pp: ExportParams) => void }[] = [
    { key: "receita", fn: secaoReceita },
    { key: "despesa", fn: secaoDespesa },
    { key: "dre", fn: secaoDre },
    { key: "fluxo", fn: secaoFluxo },
    { key: "resultado", fn: secaoResultado },
    { key: "capital", fn: secaoCapital },
  ];
  for (const { key, fn } of ordem) {
    if (abas.includes(key)) fn(doc, p);
  }

  // rodapé em todas as páginas (com total)
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // zera a margem inferior para o texto do rodapé não disparar quebra
    // automática de página (criaria páginas em branco)
    doc.page.margins.bottom = 0;
    const w = doc.page.width;
    const h = doc.page.height;
    doc
      .moveTo(M, h - M - 14)
      .lineTo(w - M, h - M - 14)
      .lineWidth(0.5)
      .strokeColor(LINE)
      .stroke();
    doc.font("Helvetica").fontSize(7).fillColor(FAINT);
    doc.text(limpa(`Almeida Closet - Gestão de Lançamentos · gerado em ${geradoEm}`), M, h - M - 8, {
      lineBreak: false,
    });
    doc.text(`Página ${i - range.start + 1} de ${range.count}`, w - M - 100, h - M - 8, {
      width: 100,
      align: "right",
      lineBreak: false,
    });
  }

  doc.end();
  return fim;
}

// Reexporta tipos usados pela API
export type { AbaKey, ExportParams };
