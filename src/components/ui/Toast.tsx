"use client";

import * as React from "react";
import { Icon } from "@/components/Icon";

interface ToastState {
  msg: string;
  tipo?: "sucesso" | "erro";
}

const ToastContext = React.createContext<(msg: string, tipo?: "sucesso" | "erro") => void>(
  () => {},
);

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = React.useCallback((msg: string, tipo: "sucesso" | "erro" = "sucesso") => {
    setToast({ msg, tipo });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-[13px] bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,.5)] animate-toastin"
        >
          <span
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full"
            style={{ background: toast.tipo === "erro" ? "#cb4a44" : "#1f875c" }}
          >
            <Icon name={toast.tipo === "erro" ? "x" : "check"} size={13} color="#fff" strokeWidth={3} />
          </span>
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}
