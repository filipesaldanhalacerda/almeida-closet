"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

export default function SucessoPage() {
  const router = useRouter();

  React.useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/app");
      router.refresh();
    }, 1250);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app px-9 text-center">
      <div className="flex h-[104px] w-[104px] animate-pop items-center justify-center rounded-full bg-venda-fg shadow-[0_20px_40px_-14px_rgba(47,125,91,.6)]">
        <Icon name="check" size={50} color="#fff" strokeWidth={2.6} />
      </div>
      <div className="mt-6 text-2xl font-extrabold">Lançamento salvo</div>
      <div className="mt-2 text-[15px] text-ink-3">Tudo certo, pode seguir atendendo.</div>
    </div>
  );
}
