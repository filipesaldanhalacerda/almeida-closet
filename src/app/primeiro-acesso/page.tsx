"use client";

import { Playfair_Display } from "next/font/google";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const VESTIDO =
  "M22.5 15.5C25 14.5 28 17 32 21C36 17 39 14.5 41.5 15.5C40 21 38.8 26.5 37 31.5L49 50C40 53 24 53 15 50L27 31.5C25.2 26.5 24 21 22.5 15.5Z";

const inputBase =
  "h-14 w-full rounded-[14px] border border-[#e4dbc9] bg-white px-4 text-[15px] text-[#2b2531] outline-none transition-shadow placeholder:text-[#aa9f8c] focus:border-[#c99a5c] focus:shadow-[0_0_0_4px_rgba(201,154,92,.14)]";

const botaoPrimario =
  "flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-[#c69759] text-[15px] font-bold text-[#241a0c] shadow-[0_14px_34px_-16px_rgba(198,151,89,.6)] transition-transform active:scale-[.99] disabled:opacity-60";

type Passo = "codigo" | "novo" | "reset" | "boasvindas";

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [passo, setPasso] = React.useState<Passo>("codigo");
  const [codigo, setCodigo] = React.useState("");
  const [nome, setNome] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [senha2, setSenha2] = React.useState("");
  const [alvoNome, setAlvoNome] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(false);
  // Para onde ir após criar a conta (o servidor pode devolver /login se o
  // login automático falhar).
  const [destino, setDestino] = React.useState("/app");

  async function validarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Código inválido");
        return;
      }
      if (data.tipo === "reset_senha") {
        setAlvoNome(data.alvoNome);
        setPasso("reset");
      } else {
        setPasso("novo");
      }
    } catch {
      setErro("Sem conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== senha2) return setErro("As senhas não conferem");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/primeiro-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nome, username, senha, senha2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível criar a conta");
        return;
      }
      setNome(data.nome || nome);
      setDestino(data.redirect || "/app");
      setPasso("boasvindas");
    } catch {
      setErro("Sem conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  async function redefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha !== senha2) return setErro("As senhas não conferem");
    if (senha.length < 6) return setErro("A senha precisa ter ao menos 6 caracteres");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/reset-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, senha, senha2 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível redefinir a senha");
        return;
      }
      router.replace(data.redirect || "/app");
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  // ---- boas-vindas (sucesso) ----------------------------------------------
  if (passo === "boasvindas") {
    return (
      <Fundo>
        <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-9 text-center">
          <div className="flex h-[92px] w-[92px] animate-pop items-center justify-center rounded-full bg-[#f1e2c6] ring-1 ring-[#e3caa0]">
            <Icon name="check" size={44} color="#b58a4f" strokeWidth={2.2} />
          </div>
          <div className={`${serif.className} mt-7 text-[30px] font-medium tracking-[-.01em]`}>
            Bem-vinda, {nome.split(" ")[0]}!
          </div>
          <div className="mt-3 max-w-[260px] text-[14.5px] leading-[1.55] text-[#8a7e6c]">
            Seu acesso está pronto. Agora é só registrar suas vendas direto pelo celular.
          </div>
          <button
            onClick={() => {
              router.replace(destino);
              router.refresh();
            }}
            className={`mt-10 ${botaoPrimario}`}
          >
            Começar
            <Icon name="arrowRight" size={18} color="#241a0c" strokeWidth={2.2} />
          </button>
        </main>
      </Fundo>
    );
  }

  const titulo =
    passo === "codigo" ? "Ative seu acesso" : passo === "novo" ? "Crie seu acesso" : "Redefinir senha";
  const descricao =
    passo === "codigo"
      ? "Digite o código que a gerência enviou para você."
      : passo === "novo"
        ? "Escolha seu nome, usuário e senha. Você vai usar isso nos próximos acessos."
        : `${alvoNome ? `Olá, ${alvoNome.split(" ")[0]}. ` : ""}Crie uma nova senha para o seu acesso.`;

  return (
    <Fundo>
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.25rem,env(safe-area-inset-top))]">
        <button
          onClick={() => (passo === "codigo" ? router.push("/login") : setPasso("codigo"))}
          className="flex items-center gap-1.5 self-start py-1.5 text-[13.5px] font-semibold text-[#7c7161] transition-colors active:text-[#2b2531]"
        >
          <Icon name="back" size={18} /> Voltar
        </button>

        {/* Selo da marca */}
        <div className="mt-5 flex items-center gap-2.5">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(43,37,48,.25)] ring-1 ring-[#e6dcc9]">
            <svg
              width="18"
              height="18"
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
          <span className={`${serif.className} text-[17px] font-medium tracking-[-.01em]`}>
            Almeida Closet
          </span>
        </div>

        <div className="mt-9">
          <h1 className={`${serif.className} text-[30px] font-medium leading-[1.05] tracking-[-.01em]`}>
            {titulo}
          </h1>
          <p className="mt-3 max-w-[19rem] text-[14.5px] leading-[1.5] text-[#8a7e6c]">{descricao}</p>
        </div>

        {passo === "codigo" && (
          <form onSubmit={validarCodigo} className="mt-7">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="AC1B2C"
              maxLength={12}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              className="h-16 w-full rounded-[14px] border border-[#e4dbc9] bg-white px-4 text-center text-[26px] font-bold tracking-[.34em] text-[#2b2531] outline-none transition-shadow placeholder:text-[#c7bda9] focus:border-[#c99a5c] focus:shadow-[0_0_0_4px_rgba(201,154,92,.14)]"
            />
            {erro && <ErroBox msg={erro} />}
            <button type="submit" disabled={carregando} className={`mt-6 ${botaoPrimario}`}>
              {carregando ? "Validando…" : "Validar código"}
            </button>
          </form>
        )}

        {passo === "novo" && (
          <form onSubmit={criarConta} className="mt-7">
            <div className="flex flex-col gap-4">
              <Campo label="Seu nome">
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Thainá Alves" className={inputBase} />
              </Campo>
              <Campo label="Nome de usuário">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="ex: thaina"
                  autoCapitalize="none"
                  className={inputBase}
                />
              </Campo>
              <Campo label="Nova senha">
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" className={inputBase} />
              </Campo>
              <Campo label="Confirmar senha">
                <input type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} placeholder="repita a senha" className={inputBase} />
              </Campo>
            </div>
            {erro && <ErroBox msg={erro} />}
            <button type="submit" disabled={carregando} className={`mt-6 ${botaoPrimario}`}>
              {carregando ? "Criando…" : "Criar acesso e entrar"}
            </button>
          </form>
        )}

        {passo === "reset" && (
          <form onSubmit={redefinir} className="mt-7">
            <div className="flex flex-col gap-4">
              <Campo label="Nova senha">
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" className={inputBase} />
              </Campo>
              <Campo label="Confirmar senha">
                <input type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} placeholder="repita a senha" className={inputBase} />
              </Campo>
            </div>
            {erro && <ErroBox msg={erro} />}
            <button type="submit" disabled={carregando} className={`mt-6 ${botaoPrimario}`}>
              {carregando ? "Salvando…" : "Salvar senha e entrar"}
            </button>
          </form>
        )}
      </main>
    </Fundo>
  );
}

// Fundo boutique claro (mesmo padrão da login).
function Fundo({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#f3ede2] text-[#2b2531]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-[24rem] w-[24rem] rounded-full bg-[#e8d0aa]/40 blur-[110px]" />
        <div className="absolute -right-24 bottom-[4%] h-[22rem] w-[22rem] rounded-full bg-[#e6c9b4]/35 blur-[110px]" />
      </div>
      <svg
        className="pointer-events-none absolute -right-16 top-8 h-[420px] w-[420px] opacity-[.07]"
        viewBox="0 0 64 64"
        fill="none"
        stroke="#c99a5c"
        strokeWidth="1.2"
        aria-hidden="true"
      >
        <path d={VESTIDO} strokeLinejoin="round" strokeLinecap="round" />
        <path d="M27 31.5H37" strokeLinecap="round" />
      </svg>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[.18em] text-[#94856d]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErroBox({ msg }: { msg: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-[13px] border border-[#e8c6be] bg-[#f8ebe6] px-4 py-3 text-sm font-medium text-[#b0472f]">
      <span className="mt-px flex-none">
        <Icon name="alert" size={16} color="#b0472f" strokeWidth={2.2} />
      </span>
      {msg}
    </div>
  );
}
