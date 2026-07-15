// Skeletons com shimmer (estilo iFood): espelham a forma de cada tela para
// reduzir a espera percebida e evitar salto de layout (CLS). A classe
// .skeleton (globals.css) já traz o brilho e o fallback de reduced-motion.

/** Bloco base do skeleton. Use classes de tamanho/raio via className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded-[10px] ${className}`} />;
}

/** Uma linha de lançamento (espelha LancamentoCard). */
export function LinhaLancamentoSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-white px-[15px] py-3.5">
      <Skeleton className="h-[42px] w-[42px] flex-none rounded-[11px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-[13px] w-1/2" />
        <Skeleton className="h-[11px] w-2/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-[13px] w-16" />
        <Skeleton className="h-[10px] w-10" />
      </div>
    </div>
  );
}

function Linhas({ n }: { n: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: n }).map((_, i) => (
        <LinhaLancamentoSkeleton key={i} />
      ))}
    </div>
  );
}

/** Home da vendedora (espelha app/page.tsx). */
export function HomeVendedoraSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 px-5 pb-24 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-12 w-12 flex-none rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-[10px] w-16" />
              <Skeleton className="h-[20px] w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>

        <div className="mt-5 rounded-[22px] border border-line bg-white p-5">
          <Skeleton className="h-[12px] w-40" />
          <Skeleton className="mt-4 h-[13px] w-28" />
          <Skeleton className="mt-2 h-[40px] w-48" />
          <div className="mt-4 flex items-center justify-between border-t border-line-2 pt-3.5">
            <Skeleton className="h-[12px] w-24" />
            <Skeleton className="h-[13px] w-20" />
          </div>
        </div>

        <Skeleton className="mt-4 h-[76px] w-full rounded-[18px]" />

        <div className="mb-3 mt-7 flex items-center justify-between">
          <Skeleton className="h-[15px] w-44" />
          <Skeleton className="h-[12px] w-12" />
        </div>
        <Linhas n={3} />
      </div>
    </div>
  );
}

/** Lista de lançamentos da vendedora (espelha MeusLancamentos). */
export function ListaLancamentosSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-none border-b border-line-2 bg-app px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.375rem)]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <Skeleton className="h-10 w-10 flex-none rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[18px] w-40" />
            <Skeleton className="h-[11px] w-24" />
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-[13px]" />
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-9 w-14 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex-1 px-5 pt-3">
        <Linhas n={6} />
      </div>
    </div>
  );
}

/** Formulário de lançamento da vendedora (espelha o corpo com teclado). */
export function FormularioSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col px-5 pt-2">
      <div className="flex items-center gap-2.5 px-1 pb-3 pt-[calc(env(safe-area-inset-top)+0.375rem)]">
        <Skeleton className="h-10 w-10 flex-none rounded-full" />
        <Skeleton className="h-[18px] w-40" />
      </div>
      <div className="px-1">
        <Skeleton className="h-[54px] w-full rounded-[13px]" />
        <div className="mb-5 mt-5 flex flex-col items-center gap-2">
          <Skeleton className="h-[11px] w-32" />
          <Skeleton className="h-[46px] w-52" />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-[15px]" />
          ))}
        </div>
        <Skeleton className="mt-6 h-[52px] w-full rounded-[12px]" />
      </div>
    </div>
  );
}

/** Conteúdo genérico do gestor dentro da AdminShell (cards + tabela). */
export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[14px] border border-line bg-white p-4">
            <Skeleton className="h-[11px] w-16" />
            <Skeleton className="mt-3 h-[22px] w-24" />
            <Skeleton className="mt-2 h-[10px] w-20" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-white">
        <div className="border-b border-line-2 bg-panel px-5 py-3">
          <Skeleton className="h-[12px] w-40" />
        </div>
        <div className="flex flex-col divide-y divide-[#f2efe9]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-9 w-9 flex-none rounded-[11px]" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-[13px] w-1/3" />
                <Skeleton className="h-[11px] w-1/4" />
              </div>
              <Skeleton className="h-[13px] w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
