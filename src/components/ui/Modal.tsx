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

/** Bottom sheet (mobile). Rola internamente e sempre há como fechar (X + toque fora). */
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
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadein items-end bg-[rgba(20,18,15,.42)]"
      onClick={onClose}
    >
      <div
        className="animate-sheetup mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-t-[26px] bg-app"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative flex-none pb-1 pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-[#d8d3ca]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#efece5] text-ink-3 active:scale-95"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}
