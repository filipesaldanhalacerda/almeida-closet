"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível entrar");
        return;
      }
      router.replace(data.redirect || "/app");
      router.refresh();
    } catch {
      setErro("Sem conexão. Verifique a internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen md:flex md:items-center md:justify-center md:bg-[radial-gradient(115%_90%_at_50%_-12%,#efece5_0%,#e6e2da_52%,#ded9d0_100%)] md:px-6 md:py-12">
      <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-8 pb-8 pt-12 md:min-h-0 md:rounded-[32px] md:border md:border-black/5 md:bg-app md:px-10 md:py-12 md:shadow-[0_40px_70px_-28px_rgba(0,0,0,.35)]">
      <div className="mb-auto">
        <div className="text-[11px] font-bold uppercase tracking-[.24em] text-faint-2">
          Gestão de lançamentos
        </div>
        <div className="mt-3 text-[34px] font-extrabold leading-[1.02] tracking-[-.03em]">
          Almeida
          <br />
          Closet
        </div>
      </div>

      <form onSubmit={entrar} className="mt-9">
        <div className="mb-5 text-[19px] font-extrabold tracking-[-.01em]">Entrar na sua conta</div>

        <label htmlFor="usuario" className="mb-2 block text-[12.5px] font-bold text-ink-3">
          Usuário ou código
        </label>
        <input
          id="usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="ex: thaina"
          autoCapitalize="none"
          autoComplete="username"
          className="focus-ring mb-4 h-14 w-full rounded-[14px] border border-input-border-2 bg-white px-4 text-base"
        />

        <label htmlFor="senha" className="mb-2 block text-[12.5px] font-bold text-ink-3">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="focus-ring mb-6 h-14 w-full rounded-[14px] border border-input-border-2 bg-white px-4 text-base"
        />

        {erro && (
          <div className="mb-4 rounded-[12px] border border-[#eccec5] bg-desp-bg px-4 py-3 text-sm font-semibold text-desp-fg">
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[14px] bg-ink text-base font-bold text-white shadow-primary transition-transform active:scale-[.99] disabled:opacity-60"
        >
          {carregando ? "Entrando…" : "Entrar"}
          {!carregando && <Icon name="arrowRight" size={18} color="#fff" strokeWidth={2.2} />}
        </button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-input-border-2" />
          <span className="text-xs font-semibold text-faint-2">ou</span>
          <span className="h-px flex-1 bg-input-border-2" />
        </div>

        <Link
          href="/primeiro-acesso"
          className="flex h-[54px] w-full items-center justify-center rounded-[14px] border border-[#d8d3ca] bg-white text-[15px] font-bold text-ink-2 active:bg-app"
        >
          Primeiro acesso com código
        </Link>
      </form>

      <div className="mt-6 text-center text-[12.5px] text-faint">
        Esqueceu a senha? Fale com a gerência.
      </div>
      </main>
    </div>
  );
}
