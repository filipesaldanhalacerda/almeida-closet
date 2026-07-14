"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

// Barra de progresso no topo (estilo YouTube). Dá feedback IMEDIATO de que
// algo está carregando ao navegar — em links e em navegações programáticas
// (router.push/replace) — já que páginas dinâmicas do App Router podem levar
// alguns segundos para trocar. Sem isso, o usuário clica e "nada acontece".
export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = React.useState(0);
  const [visivel, setVisivel] = React.useState(false);
  const timers = React.useRef<number[]>([]);

  const limpar = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const finalizar = React.useCallback(() => {
    limpar();
    setProgress(100);
    timers.current.push(window.setTimeout(() => setVisivel(false), 220));
    timers.current.push(window.setTimeout(() => setProgress(0), 450));
  }, [limpar]);

  const iniciar = React.useCallback(() => {
    limpar();
    setVisivel(true);
    setProgress(8);
    // Avanço "otimista" enquanto a página não chega.
    const passos: [number, number][] = [
      [120, 28],
      [320, 50],
      [700, 68],
      [1300, 80],
      [2400, 90],
      [5000, 96],
    ];
    passos.forEach(([t, p]) =>
      timers.current.push(window.setTimeout(() => setProgress(p), t)),
    );
    // Trava de segurança: se a navegação nunca completar, esconde.
    timers.current.push(window.setTimeout(() => finalizar(), 15000));
  }, [limpar, finalizar]);

  // Navegação concluída quando a URL (rota OU querystring) muda.
  React.useEffect(() => {
    finalizar();
  }, [pathname, searchParams, finalizar]);

  React.useEffect(() => {
    function urlMuda(destino?: string | URL | null): boolean {
      if (destino == null) return true;
      try {
        const u = new URL(String(destino), location.href);
        return u.pathname !== location.pathname || u.search !== location.search;
      } catch {
        return true;
      }
    }

    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const alvo = (e.target as HTMLElement | null)?.closest?.("a");
      if (!alvo) return;
      const href = alvo.getAttribute("href");
      if (
        !href ||
        alvo.target === "_blank" ||
        alvo.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;
      let u: URL;
      try {
        u = new URL(alvo.href, location.href);
      } catch {
        return;
      }
      if (u.origin !== location.origin || !urlMuda(u)) return;
      iniciar();
    }

    document.addEventListener("click", onClick, true);

    // Intercepta navegações programáticas (router.push/replace usam history).
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      if (urlMuda(args[2])) iniciar();
      return origPush.apply(this, args);
    };
    history.replaceState = function (
      this: History,
      ...args: Parameters<History["replaceState"]>
    ) {
      if (urlMuda(args[2])) iniciar();
      return origReplace.apply(this, args);
    };
    function onPop() {
      iniciar();
    }
    window.addEventListener("popstate", onPop);

    return () => {
      document.removeEventListener("click", onClick, true);
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", onPop);
      limpar();
    };
  }, [iniciar, limpar]);

  if (!visivel) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-ink transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%`, boxShadow: "0 0 8px rgba(28,26,23,.45)" }}
      />
    </div>
  );
}
