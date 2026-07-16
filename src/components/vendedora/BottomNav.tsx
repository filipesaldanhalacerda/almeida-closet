"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { haptics } from "@/lib/haptics";

function NavItem({
  href,
  icon,
  label,
  ativo,
}: {
  href: string;
  icon: IconName;
  label: string;
  ativo: boolean;
}) {
  const cor = ativo ? "#e8674c" : "rgba(255,255,255,.55)";
  return (
    <Link
      href={href}
      onClick={() => haptics.leve()}
      aria-current={ativo ? "page" : undefined}
      className="flex h-full flex-1 flex-col items-center justify-center gap-[3px] transition-transform active:scale-95"
    >
      <Icon name={icon} size={21} color={cor} strokeWidth={ativo ? 2.3 : 1.9} />
      <span className="text-[10.5px] font-bold" style={{ color: cor }}>
        {label}
      </span>
    </Link>
  );
}

// Dock flutuante navy com FAB coral central elevado.
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const inicio = pathname === "/app";
  const lista = pathname.startsWith("/app/lancamentos") && !pathname.includes("/novo");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[440px] justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+0.65rem)]">
      <div className="pointer-events-auto relative flex h-[62px] w-full items-center rounded-[26px] bg-night px-2 shadow-night ring-1 ring-white/[.06]">
        <NavItem href="/app" icon="home" label="Início" ativo={inicio} />
        <div className="w-[64px] flex-none" />
        <NavItem href="/app/lancamentos" icon="list" label="Lançamentos" ativo={lista} />

        <button
          onClick={() => {
            haptics.toque();
            router.push("/app/lancamentos/novo");
          }}
          aria-label="Novo lançamento"
          className="absolute left-1/2 top-0 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-white shadow-primary ring-4 ring-app transition-transform active:scale-90"
        >
          <Icon name="plus" size={26} color="#fff" strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
