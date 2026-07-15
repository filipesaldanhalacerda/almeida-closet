"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { haptics } from "@/lib/haptics";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const inicio = pathname === "/app";
  const lista = pathname.startsWith("/app/lancamentos") && !pathname.includes("/novo");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[calc(88px+env(safe-area-inset-bottom))] w-full max-w-[440px] items-start bg-gradient-to-t from-app from-[62%] to-transparent px-2 pb-[env(safe-area-inset-bottom)] pt-3.5">
      {/* 3 seções de largura igual (1/3 cada), mantém o "+" no centro exato */}
      <Link
        href="/app"
        onClick={() => haptics.leve()}
        aria-current={inicio ? "page" : undefined}
        className="pointer-events-auto flex flex-1 flex-col items-center gap-[3px] transition-transform active:scale-95"
        style={{ color: inicio ? "#1c1a17" : "#a09a90" }}
      >
        <Icon name="home" size={22} />
        <span className="text-[11px] font-semibold">Início</span>
      </Link>
      <div className="flex flex-1 justify-center">
        <button
          onClick={() => {
            haptics.toque();
            router.push("/app/lancamentos/novo");
          }}
          aria-label="Novo lançamento"
          className="pointer-events-auto -mt-1.5 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_10px_20px_-6px_rgba(28,26,23,.5)] transition-transform active:scale-90"
        >
          <Icon name="plus" size={24} color="#fff" strokeWidth={2.2} />
        </button>
      </div>
      <Link
        href="/app/lancamentos"
        onClick={() => haptics.leve()}
        aria-current={lista ? "page" : undefined}
        className="pointer-events-auto flex flex-1 flex-col items-center gap-[3px] transition-transform active:scale-95"
        style={{ color: lista ? "#1c1a17" : "#a09a90" }}
      >
        <Icon name="list" size={22} />
        <span className="text-[11px] font-semibold">Lançamentos</span>
      </Link>
    </div>
  );
}
