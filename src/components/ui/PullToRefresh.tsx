"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { haptics } from "@/lib/haptics";

// Puxar para atualizar (estilo iFood). Este componente É o container de
// rolagem: recebe as mesmas classes do <div> que substitui. Só engata quando
// já está no topo; puxa com resistência e dispara router.refresh() ao soltar
// além do limite. Respeita prefers-reduced-motion.
const LIMITE = 72; // px de puxada para disparar

export function PullToRefresh({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);
  const [pull, setPull] = React.useState(0);
  const [atualizando, setAtualizando] = React.useState(false);

  const inicioY = React.useRef(0);
  const ativo = React.useRef(false);
  const cruzou = React.useRef(false);

  const progresso = Math.min(pull / LIMITE, 1);
  const reduz =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  function onStart(e: React.TouchEvent) {
    if (atualizando) return;
    const el = ref.current;
    if (!el || el.scrollTop > 0) return; // só quando está no topo
    inicioY.current = e.touches[0].clientY;
    ativo.current = true;
    cruzou.current = false;
  }

  function onMove(e: React.TouchEvent) {
    if (!ativo.current || atualizando) return;
    const dy = e.touches[0].clientY - inicioY.current;
    if (dy <= 0) {
      if (pull !== 0) setPull(0);
      return;
    }
    const p = Math.min(dy * 0.5, 96); // resistência + teto
    if (p >= LIMITE && !cruzou.current) {
      cruzou.current = true;
      haptics.leve();
    } else if (p < LIMITE) {
      cruzou.current = false;
    }
    setPull(p);
  }

  function onEnd() {
    if (!ativo.current) return;
    ativo.current = false;
    if (pull >= LIMITE && !atualizando) {
      setAtualizando(true);
      setPull(52); // trava no indicador enquanto atualiza
      router.refresh();
      window.setTimeout(() => {
        setAtualizando(false);
        setPull(0);
      }, 700);
    } else {
      setPull(0);
    }
  }

  const transicao = ativo.current || reduz ? "none" : "transform .3s cubic-bezier(.4,0,.2,1)";

  return (
    <div
      ref={ref}
      className={`relative overscroll-y-contain ${className}`}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      {/* Indicador no topo: aparece conforme a puxada. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center"
        style={{
          opacity: atualizando ? 1 : progresso,
          transform: `translateY(${pull * 0.4}px) scale(${0.7 + progresso * 0.3})`,
        }}
        aria-hidden={!atualizando}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
          {atualizando ? (
            <Spinner size={18} />
          ) : (
            <span
              className="flex"
              style={{ transform: `rotate(${progresso * 180}deg)`, transition: "transform .1s linear" }}
            >
              <Icon name="chevronDown" size={18} color="#6f6a63" />
            </span>
          )}
        </div>
      </div>

      {/* transform só durante a puxada: no repouso não cria contexto que
          poderia afetar position: sticky no conteúdo. */}
      <div style={{ transform: pull ? `translateY(${pull}px)` : undefined, transition: transicao }}>
        {children}
      </div>
    </div>
  );
}
