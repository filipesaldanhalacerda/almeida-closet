"use client";

import { Playfair_Display } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

// Serifa editorial carregada SÓ nesta tela (não altera a tipografia do resto).
const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Caminho do vestido da marca (mesmo do favicon), usado como marca-d'água.
const VESTIDO =
  "M22.5 15.5C25 14.5 28 17 32 21C36 17 39 14.5 41.5 15.5C40 21 38.8 26.5 37 31.5L49 50C40 53 24 53 15 50L27 31.5C25.2 26.5 24 21 22.5 15.5Z";

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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#f3ede2] text-[#2b2531]">
      {/* Atmosfera clara e quente, bem sutil */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[24rem] w-[24rem] rounded-full bg-[#e8d0aa]/40 blur-[110px]" />
        <div className="absolute -right-24 bottom-[4%] h-[22rem] w-[22rem] rounded-full bg-[#e6c9b4]/35 blur-[110px]" />
      </div>

      {/* Vestido da marca como marca-d'água discreta */}
      <svg
        className="pointer-events-none absolute -right-16 top-8 h-[420px] w-[420px] opacity-[.08]"
        viewBox="0 0 64 64"
        fill="none"
        stroke="#c99a5c"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d={VESTIDO} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M27 31.5H37" strokeLinecap="round" />
      </svg>

      <main className="relative z-10 mx-auto flex w-full max-w-[430px] flex-1 flex-col px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3.5rem,env(safe-area-inset-top))]">
        {/* Marca */}
        <header className="animate-rise">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(43,37,48,.25)] ring-1 ring-[#e6dcc9]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 64 64"
                fill="none"
                stroke="#c0904f"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d={VESTIDO} />
                <path d="M27 31.5H37" />
              </svg>
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#d7bf95] to-transparent" />
          </div>

          <div className="mt-8 text-[10.5px] font-semibold uppercase tracking-[.3em] text-[#a9884f]">
            Boutique
          </div>
          <h1
            className={`${serif.className} mt-3 text-[clamp(40px,13vw,54px)] font-medium leading-[.95] tracking-[-.01em] text-[#2b2531]`}
          >
            Almeida
            <span className="block font-normal">Closet</span>
          </h1>
          <p className="mt-5 max-w-[17rem] text-[13.5px] leading-relaxed text-[#8a7e6c]">
            Gestão de vendas, recebimentos e despesas, direto do balcão.
          </p>
        </header>

        {/* Formulário logo abaixo da marca */}
        <form
          onSubmit={entrar}
          className="animate-rise mt-10"
          style={{ animationDelay: ".1s" }}
          noValidate
        >
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="usuario"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[.18em] text-[#94856d]"
              >
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
                className="h-14 w-full rounded-[14px] border border-[#e4dbc9] bg-white px-4 text-[15px] text-[#2b2531] outline-none transition-shadow placeholder:text-[#aa9f8c] focus:border-[#c99a5c] focus:shadow-[0_0_0_4px_rgba(201,154,92,.14)]"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[.18em] text-[#94856d]"
              >
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
                  className="h-14 w-full rounded-[14px] border border-[#e4dbc9] bg-white pl-4 pr-12 text-[15px] text-[#2b2531] outline-none transition-shadow placeholder:text-[#aa9f8c] focus:border-[#c99a5c] focus:shadow-[0_0_0_4px_rgba(201,154,92,.14)]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[11px] text-[#94856d] transition-colors active:bg-[#efe7d8]"
                >
                  <Icon name={mostrarSenha ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-[13px] border border-[#e8c6be] bg-[#f8ebe6] px-4 py-3 text-sm font-medium text-[#b0472f]"
            >
              <span className="mt-px flex-none">
                <Icon name="alert" size={16} color="#b0472f" strokeWidth={2.2} />
              </span>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#c69759] text-[15px] font-bold text-[#241a0c] shadow-[0_14px_34px_-16px_rgba(198,151,89,.6)] transition-transform active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#241a0c]/25 border-t-[#241a0c]" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <Icon name="arrowRight" size={18} color="#241a0c" strokeWidth={2.2} />
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#e4dbc9]" />
            <span className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#9a8c73]">
              ou
            </span>
            <span className="h-px flex-1 bg-[#e4dbc9]" />
          </div>

          <Link
            href="/primeiro-acesso"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#e4dbc9] bg-white text-[14.5px] font-semibold text-[#4c4433] transition-colors active:bg-[#f1e9da]"
          >
            <Icon name="tag" size={17} color="#b58a4f" />
            Primeiro acesso com código
          </Link>
        </form>

        <p className="mt-8 text-center text-[12px] text-[#948872]">
          Esqueceu a senha? Fale com a gerência.
        </p>
      </main>
    </div>
  );
}
