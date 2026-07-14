/** Spinner circular (anel girando). Server-safe (sem hooks). */
export function Spinner({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block shrink-0 animate-spin rounded-full border-[3px] border-[#e3dfd8] border-t-ink ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Estado de carregamento de tela: spinner + rótulo, centralizado. */
export function CarregandoTela({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[65dvh] flex-1 flex-col items-center justify-center gap-3.5 py-12">
      <Spinner size={34} />
      <span className="text-[13.5px] font-semibold text-muted">{label}</span>
    </div>
  );
}
