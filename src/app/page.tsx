import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

// A raiz encaminha conforme o papel (o middleware também cobre este caso).
export default async function RootPage() {
  const profile = await getSessionProfile().catch(() => null);
  if (!profile) redirect("/login");
  redirect(profile.role === "gestor" ? "/admin" : "/app");
}
