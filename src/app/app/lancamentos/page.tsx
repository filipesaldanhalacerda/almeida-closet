import { redirect } from "next/navigation";
import { MeusLancamentos } from "@/components/vendedora/MeusLancamentos";
import { getLancamentos, getSessionProfile } from "@/lib/data";
import { hojeIso } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus lançamentos · Almeida Closet" };

export default async function MeusLancamentosPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const todos = await getLancamentos({});
  const meus = todos.filter((l) => l.criado_por === profile.id);

  return <MeusLancamentos lancamentos={meus} hoje={hojeIso()} />;
}
