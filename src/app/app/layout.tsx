import { redirect } from "next/navigation";
import { ToastFromSession } from "@/components/ToastFromSession";
import { ToastProvider } from "@/components/ui/Toast";
import { getSessionProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

// Área da vendedora — sempre mobile. O gestor é redirecionado para /admin.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "gestor") redirect("/admin");

  return (
    <ToastProvider>
      <ToastFromSession />
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-app">
        {children}
      </div>
    </ToastProvider>
  );
}
