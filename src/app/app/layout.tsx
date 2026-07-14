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
      <div className="flex min-h-dvh justify-center bg-app sm:bg-[#e9e4db]">
        <div className="relative flex w-full max-w-[440px] flex-col bg-app sm:border-x sm:border-black/[.06]">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
