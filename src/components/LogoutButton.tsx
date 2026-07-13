"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

export function LogoutButton({ className, iconOnly = true }: { className?: string; iconOnly?: boolean }) {
  const router = useRouter();
  const [saindo, setSaindo] = React.useState(false);

  async function sair() {
    setSaindo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={sair}
      disabled={saindo}
      aria-label="Sair"
      title="Sair"
      className={cn("flex items-center gap-2 text-ink-3", className)}
    >
      <Icon name="logout" size={20} />
      {!iconOnly && <span className="text-sm font-semibold">Sair</span>}
    </button>
  );
}
