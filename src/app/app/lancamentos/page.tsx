import { redirect } from "next/navigation";
import { MeusLancamentos } from "@/components/vendedora/MeusLancamentos";
import { getLancamentos, getSessionProfile } from "@/lib/data";
import { hojeIso } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus lançamentos · Almeida Closet" };

const PAGINA = 30;

export default async function MeusLancamentosPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  // Primeira página; o restante carrega sob demanda ("Carregar mais").
  const meus = await getLancamentos({ criadoPor: profile.id, limite: PAGINA });

  return (
    <MeusLancamentos
      iniciais={meus}
      pagina={PAGINA}
      temMaisInicial={meus.length === PAGINA}
      hoje={hojeIso()}
    />
  );
}
