import { RelatoriosControls } from "@/components/gestor/RelatoriosControls";
import { contarLinhas } from "@/lib/export/contagem";
import { ABAS_INFO } from "@/lib/export/tipos";
import { getConfig, getLancamentos } from "@/lib/data";
import { hojeIso, isoParaBR, periodoLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Relatórios · Almeida Closet" };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { ano?: string; mes?: string; escopo?: string; desde?: string; ate?: string };
}) {
  const [hy, hm] = hojeIso().split("-");
  const anoAtual = Number(hy);
  const mesAtual = Number(hm);
  const isoRe = /^\d{4}-\d{2}-\d{2}$/;
  const temCustom =
    searchParams.escopo === "custom" &&
    isoRe.test(searchParams.desde || "") &&
    isoRe.test(searchParams.ate || "");
  const escopo = temCustom ? "custom" : searchParams.escopo === "ano" ? "ano" : "mes";
  const ano = Number(searchParams.ano) || anoAtual;
  const mes = Number(searchParams.mes) || mesAtual;

  const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
  const anoDoMesAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

  const opcoes = [
    { label: periodoLabel(anoAtual, mesAtual), escopo: "mes" as const, ano: anoAtual, mes: mesAtual },
    { label: periodoLabel(anoDoMesAnterior, mesAnterior), escopo: "mes" as const, ano: anoDoMesAnterior, mes: mesAnterior },
    { label: `Ano de ${anoAtual}`, escopo: "ano" as const, ano: anoAtual, mes: 12 },
  ];
  const selecionada = escopo === "custom" ? "custom" : `${escopo}-${ano}-${mes}`;

  const ultimo = new Date(ano, mes, 0).getDate();
  const desde = temCustom
    ? searchParams.desde!
    : escopo === "ano"
      ? `${ano}-01-01`
      : `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ate = temCustom
    ? searchParams.ate!
    : escopo === "ano"
      ? `${ano}-12-31`
      : `${ano}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  const anoDre = temCustom ? Number(desde.slice(0, 4)) : ano;

  const [lancamentos, config] = await Promise.all([getLancamentos({}), getConfig()]);
  const contagem = contarLinhas({ ano: anoDre, desde, ate, lancamentos, config });

  const abas = ABAS_INFO.map((a) => {
    let detalhe: string;
    switch (a.key) {
      case "receita":
        detalhe = `${contagem.receita} ${contagem.receita === 1 ? "lançamento" : "lançamentos"}`;
        break;
      case "despesa":
        detalhe = `${contagem.despesa} ${contagem.despesa === 1 ? "lançamento" : "lançamentos"}`;
        break;
      case "dre":
        detalhe = `ano de ${anoDre}`;
        break;
      case "fluxo":
        detalhe = `${contagem.fluxo} ${contagem.fluxo === 1 ? "dia com movimento" : "dias com movimento"}`;
        break;
      case "resultado":
        detalhe = `${contagem.resultado} ${contagem.resultado === 1 ? "vendedora" : "vendedoras"} · ${anoDre}`;
        break;
      default:
        detalhe = `${contagem.capital} ${contagem.capital === 1 ? "movimentação" : "movimentações"}`;
    }
    return { key: a.key, nome: a.nome, cor: a.cor, descricao: a.descricao, detalhe };
  });

  return (
    <div className="mx-auto max-w-[720px] rounded-card border border-line bg-white p-6 shadow-card">
      <div className="text-base font-extrabold">Gerar relatório</div>
      <div className="mt-1.5 text-[13.5px] leading-[1.5] text-ink-3">
        Escolha o período, as seções e o formato. O PDF sai com apresentação pronta para
        imprimir ou enviar; o Excel replica a planilha, uma aba por seção.
      </div>
      <div className="mt-2 text-[12px] font-semibold text-faint">
        Período selecionado: {isoParaBR(desde)} a {isoParaBR(ate)}
      </div>

      <RelatoriosControls
        opcoes={opcoes}
        selecionada={selecionada}
        abas={abas}
        desdeInicial={temCustom ? desde : undefined}
        ateInicial={temCustom ? ate : undefined}
      />
    </div>
  );
}
