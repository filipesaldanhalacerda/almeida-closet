"use client";

import * as React from "react";
import { Icon } from "@/components/Icon";

/** Trava a rolagem do fundo enquanto um modal/sheet está aberto. */
function useLockBody(open: boolean) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

/** Modal centralizado (desktop). O conteúdo rola internamente. */
export function Modal({
  open,
  onClose,
  children,
  width = 420,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  useLockBody(open);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadein items-center justify-center bg-[rgba(20,18,15,.4)] p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#efece5] text-ink-3 transition-colors hover:bg-[#e5e1d8] active:scale-95"
        >
          <Icon name="x" size={18} />
        </button>
        <div className="overflow-y-auto overscroll-contain p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Bottom sheet (mobile) arrastável, estilo Uber: arraste a alça para baixo
 * para fechar (drag-to-dismiss), com flick por velocidade e snap-back suave.
 * Rola internamente e sempre há como fechar (X + toque fora + Escape).
 * A alça usa arraste direto no DOM (refs) para manter 60fps. Respeita
 * prefers-reduced-motion (fecha/volta sem animação).
 */
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useLockBody(open);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Estado do arraste em refs (não re-renderiza a cada movimento).
  const arrastando = React.useRef(false);
  const inicioY = React.useRef(0);
  const desloc = React.useRef(0);
  const ultimaY = React.useRef(0);
  const ultimaT = React.useRef(0);
  const velocidade = React.useRef(0);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reduzMovimento =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  function aplicar(y: number) {
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${y}px)`;
    if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0.15, 1 - y / 520));
  }

  function onDown(e: React.PointerEvent) {
    arrastando.current = true;
    inicioY.current = e.clientY;
    desloc.current = 0;
    ultimaY.current = e.clientY;
    ultimaT.current = performance.now();
    velocidade.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    if (!arrastando.current) return;
    const dy = e.clientY - inicioY.current;
    const y = dy > 0 ? dy : dy * 0.18; // resistência ao puxar para cima
    desloc.current = y;
    const agora = performance.now();
    const dt = agora - ultimaT.current;
    if (dt > 0) velocidade.current = (e.clientY - ultimaY.current) / dt;
    ultimaY.current = e.clientY;
    ultimaT.current = agora;
    aplicar(Math.max(y, 0));
  }

  function onUp(e: React.PointerEvent) {
    if (!arrastando.current) return;
    arrastando.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ok
    }
    const el = sheetRef.current;
    const fechar = desloc.current > 120 || velocidade.current > 0.6;
    if (fechar) {
      if (el) {
        el.style.transition = reduzMovimento ? "none" : "transform .2s cubic-bezier(.4,0,1,1)";
        el.style.transform = "translateY(100%)";
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = "opacity .2s ease";
        backdropRef.current.style.opacity = "0";
      }
      window.setTimeout(onClose, reduzMovimento ? 0 : 190);
    } else {
      if (el) {
        el.style.transition = reduzMovimento ? "none" : "transform .28s cubic-bezier(.4,0,.2,1)";
        el.style.transform = "translateY(0)";
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = "opacity .28s ease";
        backdropRef.current.style.opacity = "1";
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div ref={backdropRef} className="absolute inset-0 animate-fadein bg-[rgba(20,18,15,.42)]" />
      <div
        ref={sheetRef}
        className="animate-sheetup relative mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-t-[26px] bg-app"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Alça arrastável (arraste para baixo para fechar). */}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative flex-none cursor-grab touch-none pb-1.5 pt-3 active:cursor-grabbing"
          aria-hidden
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-[#d8d3ca]" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#efece5] text-ink-3 active:scale-95"
        >
          <Icon name="x" size={18} />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
