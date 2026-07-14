import { NextRequest } from "next/server";
import { requireGestor } from "@/lib/api";
import { getConfig, getLancamentos } from "@/lib/data";
import { gerarWorkbook } from "@/lib/export/excel";
import { gerarPdf } from "@/lib/export/pdf";
import { TODAS_ABAS, type AbaKey } from "@/lib/export/tipos";

export const dynamic = "force-dynamic";

// Gera o relatório em Excel (.xlsx) ou PDF.
// Parâmetros: escopo=mes|ano|custom (+ano/mes ou desde/ate), formato=xlsx|pdf,
// abas=receita,despesa,dre,fluxo,resultado,capital (padrão: todas)
export async function GET(req: NextRequest) {
  try {
    await requireGestor();
  } catch {
    return new Response("Não autorizado", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hoje = new Date();
  // Clampa para evitar datas inválidas (ex.: ?mes=13 → "2026-13-01").
  const ano = Math.min(2100, Math.max(2000, Number(searchParams.get("ano")) || hoje.getFullYear()));
  const mes = Math.min(12, Math.max(1, Number(searchParams.get("mes")) || hoje.getMonth() + 1));
  const escopo = searchParams.get("escopo") || "mes";
  const formato = searchParams.get("formato") === "pdf" ? "pdf" : "xlsx";
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;

  // Seções selecionadas
  const abasParam = (searchParams.get("abas") || "").split(",").filter(Boolean) as AbaKey[];
  const abas: AbaKey[] = abasParam.length
    ? TODAS_ABAS.filter((a) => abasParam.includes(a))
    : [...TODAS_ABAS];
  if (abas.length === 0) return new Response("Selecione ao menos uma seção", { status: 400 });

  let desde: string;
  let ate: string;
  let base: string;
  let anoDre = ano;
  if (escopo === "custom") {
    const d = searchParams.get("desde") || "";
    const a = searchParams.get("ate") || "";
    if (!isoRe.test(d) || !isoRe.test(a) || d > a) {
      return new Response("Período personalizado inválido", { status: 400 });
    }
    desde = d;
    ate = a;
    anoDre = Number(d.slice(0, 4));
    base = `almeida-closet-${d}-a-${a}`;
  } else if (escopo === "ano") {
    desde = `${ano}-01-01`;
    ate = `${ano}-12-31`;
    base = `almeida-closet-${ano}`;
  } else {
    const ultimo = new Date(ano, mes, 0).getDate();
    desde = `${ano}-${String(mes).padStart(2, "0")}-01`;
    ate = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
    base = `almeida-closet-${ano}-${String(mes).padStart(2, "0")}`;
  }

  const [lancamentos, config] = await Promise.all([getLancamentos({}), getConfig()]);
  const params = { ano: anoDre, desde, ate, lancamentos, config };

  if (formato === "pdf") {
    const buffer = await gerarPdf(params, abas);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${base}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await gerarWorkbook(params, abas);
  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${base}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
