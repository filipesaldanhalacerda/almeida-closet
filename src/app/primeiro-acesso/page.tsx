"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";

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

  const inputBase =
    "focus-ring h-[54px] w-full rounded-[13px] border border-input-border bg-white px-4 text-base";

  if (passo === "boasvindas") {
    return (
      <div className="min-h-screen md:flex md:items-center md:justify-center md:bg-[radial-gradient(115%_90%_at_50%_-12%,#efece5_0%,#e6e2da_52%,#ded9d0_100%)] md:px-6 md:py-12">
      <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center px-9 text-center md:min-h-[560px] md:rounded-[32px] md:border md:border-black/5 md:bg-app md:shadow-[0_40px_70px_-28px_rgba(0,0,0,.35)]">
        <div className="flex h-[88px] w-[88px] animate-pop items-center justify-center rounded-full bg-venda-bg">
          <Icon name="check" size={42} color="#2f7d5b" strokeWidth={2.2} />
        </div>
        <div className="mt-7 text-[26px] font-extrabold tracking-[-.01em]">
          Bem-vinda, {nome.split(" ")[0]}!
        </div>
        <div className="mt-3 max-w-[250px] text-[15px] leading-[1.55] text-ink-3">
          Seu acesso está pronto. Agora é só registrar suas vendas direto pelo celular.
        </div>
        <button
          onClick={() => {
            router.replace("/app");
            router.refresh();
          }}
          className="mt-10 h-14 w-full rounded-[13px] bg-ink text-base font-bold text-white active:scale-[.99]"
        >
          Começar
        </button>
      </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex md:items-center md:justify-center md:bg-[radial-gradient(115%_90%_at_50%_-12%,#efece5_0%,#e6e2da_52%,#ded9d0_100%)] md:px-6 md:py-12">
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-8 pb-8 pt-6 md:min-h-[560px] md:rounded-[32px] md:border md:border-black/5 md:bg-app md:px-10 md:py-10 md:shadow-[0_40px_70px_-28px_rgba(0,0,0,.35)]">
      <button
        onClick={() => (passo === "codigo" ? router.push("/login") : setPasso("codigo"))}
        className="mb-2 flex items-center gap-1 self-start py-1.5 text-sm font-semibold text-ink-3"
      >
        <Icon name="back" size={18} /> Voltar
      </button>

      {passo === "codigo" && (
        <form onSubmit={validarCodigo} className="flex flex-1 flex-col justify-center">
          <div className="text-2xl font-extrabold tracking-[-.01em]">Ative seu acesso</div>
          <div className="mt-3 text-[15px] leading-[1.5] text-ink-3">
            Digite o código que a gerência enviou pra você.
          </div>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="AC1B2C"
            maxLength={12}
            autoCapitalize="characters"
            autoComplete="one-time-code"
            className="focus-ring my-7 h-16 w-full rounded-[13px] border border-input-border bg-white px-4 text-center text-[26px] font-bold tracking-[.34em]"
          />
          {erro && <ErroBox msg={erro} />}
          <button
            type="submit"
            disabled={carregando}
            className="h-14 w-full rounded-[13px] bg-ink text-base font-bold text-white active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? "Validando…" : "Validar código"}
          </button>
        </form>
      )}

      {passo === "novo" && (
        <form onSubmit={criarConta} className="flex flex-1 flex-col justify-center">
          <div className="text-2xl font-extrabold tracking-[-.01em]">Crie seu acesso</div>
          <div className="mt-3 text-[15px] leading-[1.5] text-ink-3">
            Escolha seu nome, usuário e senha. Você vai usar isso nos próximos acessos.
          </div>
          <div className="mt-6 flex flex-col gap-4">
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
          {erro && <div className="mt-4"><ErroBox msg={erro} /></div>}
          <button
            type="submit"
            disabled={carregando}
            className="mt-6 h-14 w-full rounded-[13px] bg-ink text-base font-bold text-white active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? "Criando…" : "Criar acesso e entrar"}
          </button>
        </form>
      )}

      {passo === "reset" && (
        <form onSubmit={redefinir} className="flex flex-1 flex-col justify-center">
          <div className="text-2xl font-extrabold tracking-[-.01em]">Redefinir senha</div>
          <div className="mt-3 text-[15px] leading-[1.5] text-ink-3">
            {alvoNome ? `Olá, ${alvoNome.split(" ")[0]}. ` : ""}Crie uma nova senha para o seu acesso.
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <Campo label="Nova senha">
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" className={inputBase} />
            </Campo>
            <Campo label="Confirmar senha">
              <input type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} placeholder="repita a senha" className={inputBase} />
            </Campo>
          </div>
          {erro && <div className="mt-4"><ErroBox msg={erro} /></div>}
          <button
            type="submit"
            disabled={carregando}
            className="mt-6 h-14 w-full rounded-[13px] bg-ink text-base font-bold text-white active:scale-[.99] disabled:opacity-60"
          >
            {carregando ? "Salvando…" : "Salvar senha e entrar"}
          </button>
        </form>
      )}
    </main>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold text-ink-2">{label}</label>
      {children}
    </div>
  );
}

function ErroBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 rounded-[12px] border border-[#eccec5] bg-desp-bg px-4 py-3 text-sm font-semibold text-desp-fg">
      {msg}
    </div>
  );
}
