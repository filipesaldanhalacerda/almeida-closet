"use client";

import * as React from "react";

/** Modal centralizado (desktop). */
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
        className="w-full rounded-2xl bg-white p-6 shadow-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

/** Bottom sheet (mobile). */
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadein items-end bg-[rgba(20,18,15,.42)]"
      onClick={onClose}
    >
      <div
        className="w-full animate-sheetup rounded-t-[26px] bg-app px-6 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#d8d3ca]" />
        {children}
      </div>
    </div>
  );
}
