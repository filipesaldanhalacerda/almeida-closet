"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Exibe um toast salvo em sessionStorage (ac_toast) após uma navegação.
 * Reage à mudança de rota (o layout não remonta entre páginas do mesmo grupo)
 * e não consome a mensagem enquanto está na tela de sucesso.
 */
export function ToastFromSession() {
  const toast = useToast();
  const pathname = usePathname();
  React.useEffect(() => {
    if (pathname.endsWith("/sucesso")) return;
    const msg = sessionStorage.getItem("ac_toast");
    if (msg) {
      sessionStorage.removeItem("ac_toast");
      toast(msg);
    }
  }, [toast, pathname]);
  return null;
}
