import { Icon } from "@/components/Icon";

export const metadata = { title: "Sem conexão — Almeida Closet" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col items-center justify-center px-9 text-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-desp-bg">
        <Icon name="wifi" size={40} color="#b04a34" />
      </div>
      <div className="mt-6 text-2xl font-extrabold">Sem conexão</div>
      <div className="mt-2.5 max-w-[260px] text-[15px] leading-[1.55] text-ink-3">
        Você está offline. Seus lançamentos ficam salvos no aparelho e serão enviados
        automaticamente quando a internet voltar.
      </div>
      <a
        href="/app"
        className="mt-8 flex h-[54px] w-full items-center justify-center rounded-[13px] bg-ink text-base font-bold text-white"
      >
        Tentar novamente
      </a>
    </main>
  );
}
