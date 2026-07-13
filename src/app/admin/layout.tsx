import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/gestor/AdminShell";
import { ToastFromSession } from "@/components/ToastFromSession";
import { ToastProvider } from "@/components/ui/Toast";
import { getSessionProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "gestor") redirect("/app");

  return (
    <ToastProvider>
      <ToastFromSession />
      <Suspense fallback={null}>
        <AdminShell nome={profile.nome}>{children}</AdminShell>
      </Suspense>
    </ToastProvider>
  );
}
