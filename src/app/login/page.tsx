"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [mostrarSenha, setMostrarSenha] = React.useState(false);
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
    <div className="flex min-h-dvh flex-col bg-app md:items-center md:justify-center md:bg-[radial-gradient(125%_125%_at_50%_-15%,#f2efe9_0%,#e8e3da_55%,#dcd6cc_100%)] md:p-6">
      <main
        className="animate-rise mx-auto flex w-full max-w-[400px] flex-1 flex-col px-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(3.25rem,env(safe-area-inset-top))] md:min-h-0 md:flex-none md:rounded-[30px] md:border md:border-black/[.055] md:bg-surface md:px-10 md:pb-11 md:pt-11 md:shadow-[0_34px_70px_-30px_rgba(28,26,23,.42)]"
      >
        {/* Marca */}
        <header className="flex flex-col items-start">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[17px] bg-ink shadow-primary">
            <span className="text-[19px] font-extrabold tracking-[-.03em] text-white">AC</span>
          </div>
          <div className="mt-5 text-[11px] font-bold uppercase tracking-[.24em] text-faint-2">
            Gestão de lançamentos
          </div>
          <h1 className="mt-2 text-[clamp(30px,9vw,36px)] font-extrabold leading-[1.02] tracking-[-.03em] text-ink">
            Almeida
            <br />
            Closet
          </h1>
        </header>

        {/* Formulário, no mobile fica na metade de baixo (perto do polegar) */}
        <form onSubmit={entrar} className="mt-auto pt-10 md:mt-9 md:pt-0" noValidate>
          <div className="text-[19px] font-extrabold tracking-[-.01em]">Entrar na sua conta</div>
          <p className="mt-1 text-[13.5px] text-muted">Acesse com seu usuário e senha.</p>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="usuario" className="mb-2 block text-[12.5px] font-bold text-ink-3">
                Usuário ou código
              </label>
              <input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="ex: thaina"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                enterKeyHint="next"
                className="focus-ring h-14 w-full rounded-[14px] border border-input-border bg-white px-4 text-base"
              />
            </div>

            <div>
              <label htmlFor="senha" className="mb-2 block text-[12.5px] font-bold text-ink-3">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  enterKeyHint="go"
                  className="focus-ring h-14 w-full rounded-[14px] border border-input-border bg-white pl-4 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[11px] text-muted active:bg-app"
                >
                  <Icon name={mostrarSenha ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-[12px] border border-[#eccec5] bg-desp-bg px-4 py-3 text-sm font-semibold text-desp-fg"
            >
              <span className="mt-px flex-none">
                <Icon name="alert" size={16} color="#b04a34" strokeWidth={2.2} />
              </span>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-5 flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[15px] bg-ink text-[15.5px] font-bold text-white shadow-primary transition-transform active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <Icon name="arrowRight" size={18} color="#fff" strokeWidth={2.2} />
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-input-border-2" />
            <span className="text-xs font-semibold text-faint-2">ou</span>
            <span className="h-px flex-1 bg-input-border-2" />
          </div>

          <Link
            href="/primeiro-acesso"
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#d8d3ca] bg-white text-[15px] font-bold text-ink-2 active:bg-app"
          >
            <Icon name="tag" size={17} color="#6f6a63" />
            Primeiro acesso com código
          </Link>
        </form>

        <p className="mt-6 text-center text-[12.5px] text-faint md:text-left">
          Esqueceu a senha? Fale com a gerência.
        </p>
      </main>
    </div>
  );
}
