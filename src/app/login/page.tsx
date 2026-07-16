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
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#151119] text-[#f2ebe1]">
      {/* Atmosfera: brilhos quentes difusos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-28 h-[28rem] w-[28rem] rounded-full bg-[#5c3038]/45 blur-[100px]" />
        <div className="absolute -right-32 top-[28%] h-[26rem] w-[26rem] rounded-full bg-[#3b2a42]/55 blur-[110px]" />
        <div className="absolute -bottom-24 left-[18%] h-[22rem] w-[22rem] rounded-full bg-[#6d4a2c]/35 blur-[100px]" />
      </div>

      {/* Vestido da marca, grande e discreto */}
      <svg
        className="pointer-events-none absolute -right-16 top-6 h-[440px] w-[440px] opacity-[.06]"
        viewBox="0 0 64 64"
        fill="none"
        stroke="#e0bd93"
        strokeWidth="1.3"
        aria-hidden="true"
      >
        <path d={VESTIDO} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M27 31.5H37" strokeLinecap="round" />
      </svg>

      <main className="relative z-10 mx-auto flex w-full max-w-[430px] flex-1 flex-col px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3.75rem,env(safe-area-inset-top))]">
        {/* Marca */}
        <header className="animate-rise">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-white/[.04] ring-1 ring-[#e0bd93]/35">
              <svg
                width="22"
                height="22"
                viewBox="0 0 64 64"
                fill="none"
                stroke="#e0bd93"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d={VESTIDO} />
                <path d="M27 31.5H37" />
              </svg>
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-[#e0bd93]/45 to-transparent" />
          </div>

          <div className="mt-8 text-[11px] font-semibold uppercase tracking-[.42em] text-[#e0bd93]">
            Boutique
          </div>
          <h1
            className={`${serif.className} mt-3 text-[clamp(46px,16vw,64px)] font-medium leading-[.92] text-[#f5eee3]`}
          >
            <span className="italic">Almeida</span>
            <span className="block font-normal tracking-[.01em]">Closet</span>
          </h1>
          <p className="mt-5 max-w-[17rem] text-[13.5px] leading-relaxed text-[#b3a695]">
            Gestão de vendas, recebimentos e despesas, direto do balcão.
          </p>
        </header>

        {/* Formulário (fica embaixo, perto do polegar) */}
        <form
          onSubmit={entrar}
          className="animate-rise mt-auto pt-12"
          style={{ animationDelay: ".1s" }}
          noValidate
        >
          <div className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="usuario"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[.18em] text-[#a99a88]"
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
                className="h-14 w-full rounded-[14px] border border-white/10 bg-white/[.05] px-4 text-[15px] text-[#f2ebe1] outline-none transition-colors placeholder:text-[#786f61] focus:border-[#e0bd93]/70 focus:bg-white/[.07]"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[.18em] text-[#a99a88]"
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
                  className="h-14 w-full rounded-[14px] border border-white/10 bg-white/[.05] pl-4 pr-12 text-[15px] text-[#f2ebe1] outline-none transition-colors placeholder:text-[#786f61] focus:border-[#e0bd93]/70 focus:bg-white/[.07]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[11px] text-[#a99a88] transition-colors active:bg-white/[.06]"
                >
                  <Icon name={mostrarSenha ? "eyeOff" : "eye"} size={20} />
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-[13px] border border-[#7a4038]/60 bg-[#3a201d]/70 px-4 py-3 text-sm font-medium text-[#eab6a8]"
            >
              <span className="mt-px flex-none">
                <Icon name="alert" size={16} color="#eab6a8" strokeWidth={2.2} />
              </span>
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#e0bd93] text-[15px] font-bold text-[#221708] shadow-[0_16px_44px_-14px_rgba(224,189,147,.55)] transition-transform active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#221708]/30 border-t-[#221708]" />
                Entrando…
              </>
            ) : (
              <>
                Entrar
                <Icon name="arrowRight" size={18} color="#221708" strokeWidth={2.2} />
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#8f8375]">
              ou
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <Link
            href="/primeiro-acesso"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[.04] text-[14.5px] font-semibold text-[#e7dfd2] transition-colors active:bg-white/[.08]"
          >
            <Icon name="tag" size={17} color="#e0bd93" />
            Primeiro acesso com código
          </Link>
        </form>

        <p className="mt-8 text-center text-[12px] text-[#877b6d]">
          Esqueceu a senha? Fale com a gerência.
        </p>
      </main>
    </div>
  );
}
