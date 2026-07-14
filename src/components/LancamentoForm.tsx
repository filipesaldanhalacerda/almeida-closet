"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { AjudaLancamento } from "@/components/AjudaLancamento";
import { Icon } from "@/components/Icon";
import { BottomSheet, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  DRE_GRUPO_LABEL,
  FORMAS_PAGAMENTO,
  MEIOS_RECEBIMENTO,
  MODALIDADES,
} from "@/lib/constants";
import {
  brl,
  centavosParaNumero,
  hojeIso,
  iniciais,
  isoParaBR,
  mascaraTelefoneBR,
  mesRefLabel,
  normalizarBusca,
  numeroParaCentavos,
} from "@/lib/format";
import { enfileirar } from "@/lib/offline-queue";
import type {
  Cliente,
  DreGrupo,
  FormaPagamento,
  LancamentoView,
  MeioRecebimento,
} from "@/lib/types";

type Modo = "vendedora" | "gestor";
type TipoForm = "venda" | "recebimento" | "despesa" | "capital";
type ModoReceb = "tudo" | "parcial" | "nao";

// Bandeiras de cartão (recebimento) — logo oficial em /public/bandeiras.
const BANDEIRAS: { valor: string; logo: string }[] = [
  { valor: "VISA", logo: "/bandeiras/visa.svg" },
  { valor: "MASTER", logo: "/bandeiras/master.svg" },
  { valor: "ELO", logo: "/bandeiras/elo.svg" },
  { valor: "HIPERCARD", logo: "/bandeiras/hipercard.svg" },
  { valor: "AMEX", logo: "/bandeiras/amex.svg" },
];

// Dica de um toque sob o seletor de tipo — linguagem do balcão
const TIPO_HINTS: Record<TipoForm, string> = {
  venda: "O que a cliente levou — valor cheio, mesmo se for pagar depois. Conta nas metas.",
  recebimento: "Dinheiro que entrou no caixa: parcela do crediário, repasse da maquininha…",
  despesa: "Dinheiro que saiu — contas e pagamentos da loja.",
  capital: "Aportes e retiradas dos sócios — não entram no resultado da loja.",
};

// Meio de recebimento sugerido a partir da forma de pagamento da venda
const MEIO_PADRAO: Record<FormaPagamento, MeioRecebimento> = {
  dinheiro: "dinheiro",
  pix_transferencia: "pix",
  cartao_credito: "cartao_credito",
  cartao_debito: "cartao_debito",
  cheque: "cheque",
  crediario: "dinheiro",
};

interface Props {
  modo: Modo;
  categorias: { id: string; nome: string; grupo?: DreGrupo | null }[];
  vendedoras?: { id: string; nome: string }[];
  clientes?: Cliente[];
  inicial?: LancamentoView | null;
}

/** Exibe centavos como valor pt-BR sem o prefixo (ex.: "1.234,56"). */
function centsDisplay(cents: string): string {
  if (!cents) return "";
  return ((parseInt(cents, 10) || 0) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function digitsDe(texto: string): string {
  return texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 9);
}

export function LancamentoForm({
  modo,
  categorias,
  vendedoras = [],
  clientes = [],
  inicial = null,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const editando = Boolean(inicial);

  const tipoInicial: TipoForm = inicial
    ? inicial.tipo === "investimento" || inicial.tipo === "devolucao_capital"
      ? "capital"
      : (inicial.tipo as TipoForm)
    : "venda";

  const [tipo, setTipo] = React.useState<TipoForm>(tipoInicial);
  const [valorCents, setValorCents] = React.useState(
    inicial ? numeroParaCentavos(inicial.valor) : "",
  );
  const [cliente, setCliente] = React.useState(
    inicial?.cliente ?? inicial?.cliente_ou_bandeira ?? "",
  );
  const [bandeira, setBandeira] = React.useState(inicial?.bandeira ?? "");
  const [forma, setForma] = React.useState<FormaPagamento | "">(
    inicial?.forma_pagamento ?? "",
  );
  const [modalidade, setModalidade] = React.useState(inicial?.modalidade ?? "presencial");
  const [meio, setMeio] = React.useState(inicial?.meio ?? "");
  const [categoriaId, setCategoriaId] = React.useState(
    inicial?.categoria_id ?? categorias[0]?.id ?? "",
  );
  const [credor, setCredor] = React.useState(inicial?.credor ?? "");
  const [data, setData] = React.useState(inicial?.data ?? hojeIso());
  const [vencimento, setVencimento] = React.useState(inicial?.data_vencimento ?? "");
  const [mesRef, setMesRef] = React.useState(
    inicial?.mes_referencia ??
      (() => {
        const p = hojeIso().split("-");
        return mesRefLabel(+p[0], +p[1]);
      })(),
  );
  const [descricao, setDescricao] = React.useState(inicial?.descricao ?? "");
  const [capKind, setCapKind] = React.useState<"aporte" | "devolucao">(
    inicial?.tipo === "devolucao_capital" ? "devolucao" : "aporte",
  );
  const [registradoPor, setRegistradoPor] = React.useState<string>(
    inicial?.vendedora_id ?? "gestor",
  );

  // Recebimento embutido na venda (só em lançamento novo)
  const [modoReceb, setModoReceb] = React.useState<ModoReceb>("tudo");
  const [recebCents, setRecebCents] = React.useState("");
  const [recebMeio, setRecebMeio] = React.useState<MeioRecebimento | "">("");

  // Cadastro de clientes (lista local atualizável)
  const [listaClientes, setListaClientes] = React.useState<Cliente[]>(clientes);

  const [salvando, setSalvando] = React.useState(false);
  const [confirmaExcluir, setConfirmaExcluir] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  const valor = centavosParaNumero(valorCents);
  const recebValor = centavosParaNumero(recebCents);
  const cor =
    tipo === "venda"
      ? "#2f7d5b"
      : tipo === "recebimento"
        ? "#2b6f74"
        : tipo === "capital"
          ? "#8c6f52"
          : "#b04a34";

  // Ao escolher a forma da venda, sugere o modo e o meio do recebimento
  function escolherForma(f: FormaPagamento) {
    setForma(f);
    if (!editando) {
      setModoReceb(f === "crediario" ? "parcial" : "tudo");
      setRecebMeio(MEIO_PADRAO[f]);
      if (f !== "crediario") setRecebCents("");
    }
  }

  // ---- teclado numérico (vendedora) ---------------------------------------
  function apertaDigito(d: string) {
    setValorCents((cur) => (cur.length >= 9 ? cur : (cur + d).replace(/^0+(?=\d)/, "")));
  }
  function apagaDigito() {
    setValorCents((cur) => cur.slice(0, -1));
  }
  function limpaValor() {
    setValorCents("");
  }

  const tiposDisponiveis: { key: TipoForm; label: string }[] =
    modo === "gestor"
      ? [
          { key: "venda", label: "Venda" },
          { key: "recebimento", label: "Recebimento" },
          { key: "despesa", label: "Despesa" },
          { key: "capital", label: "Capital" },
        ]
      : [
          { key: "venda", label: "Venda" },
          { key: "recebimento", label: "Recebimento" },
          { key: "despesa", label: "Despesa" },
        ];

  function montarBody() {
    if (tipo === "venda") {
      const incluirReceb = !editando && modoReceb !== "nao";
      return {
        tipo: "venda",
        valor,
        data,
        cliente,
        forma_pagamento: forma,
        modalidade,
        vendedora_id:
          modo === "gestor" ? (registradoPor === "gestor" ? null : registradoPor) : undefined,
        recebimento: incluirReceb
          ? {
              valor: modoReceb === "tudo" ? valor : recebValor,
              meio: recebMeio,
            }
          : undefined,
      };
    }
    if (tipo === "recebimento") {
      return {
        tipo: "recebimento",
        valor,
        data,
        cliente,
        bandeira,
        meio,
        vendedora_id:
          modo === "gestor" ? (registradoPor === "gestor" ? null : registradoPor) : undefined,
      };
    }
    if (tipo === "despesa") {
      return {
        tipo: "despesa",
        valor,
        data,
        categoria_id: categoriaId,
        credor,
        mes_referencia: mesRef,
        data_vencimento: vencimento || null,
        data_pagamento: data,
      };
    }
    return {
      tipo: capKind === "aporte" ? "investimento" : "devolucao_capital",
      valor,
      data,
      descricao,
    };
  }

  async function salvar() {
    setErro(null);
    if (valor <= 0) return setErro("Informe um valor maior que zero");

    // A cliente precisa existir no cadastro (ou ser a mesma do lançamento em edição).
    // Não deixa salvar só com o nome digitado: tem que cadastrar ou escolher da lista.
    const clienteCadastrado =
      listaClientes.some((c) => normalizarBusca(c.nome) === normalizarBusca(cliente)) ||
      (editando &&
        normalizarBusca(cliente) ===
          normalizarBusca(inicial?.cliente ?? inicial?.cliente_ou_bandeira ?? ""));

    // Validação amigável antes de enviar
    if (tipo === "venda") {
      if (!cliente.trim()) return setErro("Informe o nome da cliente");
      if (!clienteCadastrado)
        return setErro("Cadastre a cliente ou selecione uma já cadastrada antes de salvar");
      if (!forma) return setErro("Escolha a forma de pagamento");
      if (!editando && modoReceb !== "nao") {
        if (!recebMeio) return setErro("Escolha o meio do recebimento");
        if (modoReceb === "parcial" && recebValor <= 0)
          return setErro("Informe o valor da entrada recebida");
      }
    }
    if (tipo === "recebimento") {
      if (!cliente.trim() && !bandeira) return setErro("Informe a cliente ou escolha a bandeira");
      if (cliente.trim() && !clienteCadastrado)
        return setErro("Cadastre a cliente ou selecione uma já cadastrada antes de salvar");
      if (!meio) return setErro("Escolha o meio do recebimento");
    }
    if (tipo === "despesa" && !categoriaId) return setErro("Selecione a categoria");
    if (tipo === "capital" && !descricao.trim()) return setErro("Informe a descrição");

    setSalvando(true);
    const body = montarBody();
    const criouDupla = tipo === "venda" && !editando && modoReceb !== "nao";
    try {
      const url = editando ? `/api/lancamentos/${inicial!.id}` : "/api/lancamentos";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const dataRes = await res.json();
      if (!res.ok) {
        setErro(dataRes.erro || "Não foi possível salvar");
        setSalvando(false);
        return;
      }
      const msgOk = criouDupla
        ? "Venda + recebimento salvos"
        : editando
          ? "Lançamento atualizado"
          : "Lançamento salvo";
      if (modo === "vendedora") {
        sessionStorage.setItem("ac_toast", msgOk);
        router.replace("/app/sucesso");
        return;
      }
      toast(msgOk);
      router.replace(tipo === "capital" ? "/admin/capital" : "/admin/lancamentos");
      router.refresh();
    } catch {
      // Sem rede: em NOVO lançamento, guarda no aparelho (offline-first)
      if (!editando) {
        enfileirar(body);
        if (modo === "vendedora") {
          sessionStorage.setItem("ac_toast", "Salvo no aparelho — enviaremos ao reconectar");
          router.replace("/app/sucesso");
          return;
        }
        toast("Sem conexão — salvo no aparelho, enviaremos ao reconectar");
        router.replace("/admin/lancamentos");
        return;
      }
      setErro("Sem conexão. A alteração não foi enviada. Tente novamente.");
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/lancamentos/${inicial!.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.erro || "Não foi possível excluir");
        setSalvando(false);
        setConfirmaExcluir(false);
        return;
      }
      toast("Lançamento excluído");
      router.replace(modo === "gestor" ? "/admin/lancamentos" : "/app/lancamentos");
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente novamente.");
      setSalvando(false);
      setConfirmaExcluir(false);
    }
  }

  const podeExcluir = editando;
  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

  // ==== blocos =============================================================

  // Dica contextual + guia "Entenda a diferença", logo abaixo das abas
  const hintRow = (
    <div className="mt-2.5 flex items-center justify-between gap-3 px-0.5">
      <p className="min-w-0 text-[12px] leading-[1.45] text-muted">{TIPO_HINTS[tipo]}</p>
      <AjudaLancamento modo={modo} />
    </div>
  );

  const blocoRecebimentoJunto = tipo === "venda" && !editando && (
    <div className="rounded-[14px] border border-[#d9e6de] bg-[#f4f9f6] p-4">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="banknote" size={17} color="#2b6f74" />
        <span className="text-[13px] font-bold text-ink-2">Já entrou dinheiro?</span>
      </div>
      <div className="mb-3 text-[12px] leading-[1.45] text-muted">
        Registre a venda e o que entrou no caixa de uma vez só — sem precisar lançar duas vezes.
      </div>
      <div className="flex gap-2">
        {(
          [
            { key: "tudo", label: "Recebi tudo" },
            { key: "parcial", label: "Parcial" },
            { key: "nao", label: "Ainda não" },
          ] as { key: ModoReceb; label: string }[]
        ).map((o) => {
          const ativo = modoReceb === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                setModoReceb(o.key);
                if (o.key !== "nao" && !recebMeio && forma) setRecebMeio(MEIO_PADRAO[forma as FormaPagamento]);
              }}
              className="h-10 flex-1 whitespace-nowrap rounded-[10px] px-1 text-[12.5px] font-bold transition-colors"
              style={{
                border: `1px solid ${ativo ? "#2b6f74" : "#d5e0da"}`,
                background: ativo ? "#2b6f74" : "#fff",
                color: ativo ? "#fff" : "#42403b",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {modoReceb !== "nao" && (
        <div className="mt-3.5 flex flex-col gap-3.5">
          {modoReceb === "parcial" && (
            <div>
              <label className="mb-1.5 block text-[12.5px] font-bold text-ink-2">
                Valor recebido agora
              </label>
              <div className="flex h-12 items-center rounded-[11px] border border-[#d5e0da] bg-white px-3.5">
                <span className="mr-1.5 text-[14px] font-bold text-muted">R$</span>
                <input
                  value={centsDisplay(recebCents)}
                  onChange={(e) => setRecebCents(digitsDe(e.target.value))}
                  inputMode="numeric"
                  placeholder="0,00"
                  className="w-full bg-transparent text-[17px] font-extrabold tnum outline-none"
                  style={{ color: "#2b6f74" }}
                />
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-[12.5px] font-bold text-ink-2">Meio do recebimento</label>
            <div className="flex flex-wrap gap-2">
              {MEIOS_RECEBIMENTO.map((o) => {
                const ativo = o.value === recebMeio;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setRecebMeio(o.value)}
                    className="h-9 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors"
                    style={{
                      border: `1px solid ${ativo ? "#2b6f74" : "#d5e0da"}`,
                      background: ativo ? "#2b6f74" : "#fff",
                      color: ativo ? "#fff" : "#42403b",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
          {valor > 0 && (
            <div className="text-[12px] font-semibold text-receb-fg">
              Será registrado: venda de {brl(valor)} + recebimento de{" "}
              {brl(modoReceb === "tudo" ? valor : recebValor)}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const camposAdaptativos = (
    <>
      {tipo === "venda" && (
        <div className="flex flex-col gap-[18px]">
          <ClienteField
            label="Cliente"
            valor={cliente}
            onChange={setCliente}
            clientes={listaClientes}
            onCadastrada={(c) => setListaClientes((l) => [...l, c].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")))}
          />
          <ChipGroup
            label="Forma de pagamento"
            options={FORMAS_PAGAMENTO}
            value={forma}
            onChange={(v) => escolherForma(v as FormaPagamento)}
          />
          <ChipGroup
            label="Modalidade"
            options={MODALIDADES}
            value={modalidade}
            onChange={(v) => setModalidade(v as typeof modalidade)}
            fill
          />
          {blocoRecebimentoJunto}
        </div>
      )}

      {tipo === "recebimento" && (
        <div className="flex flex-col gap-[18px]">
          <ClienteField
            label="Cliente"
            placeholder="Nome da cliente (se souber)"
            valor={cliente}
            onChange={setCliente}
            clientes={listaClientes}
            onCadastrada={(c) => setListaClientes((l) => [...l, c].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")))}
          />
          <div>
            <label className="mb-2.5 block text-[13px] font-bold text-ink-2">
              Bandeira do cartão <span className="font-semibold text-faint">(quando for repasse da maquininha)</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {BANDEIRAS.map((b) => {
                const ativo = bandeira === b.valor;
                return (
                  <button
                    key={b.valor}
                    type="button"
                    onClick={() => setBandeira(ativo ? "" : b.valor)}
                    aria-label={b.valor}
                    aria-pressed={ativo}
                    title={b.valor}
                    className="relative h-[42px] w-[66px] overflow-hidden rounded-[9px] bg-white transition-transform active:scale-95"
                    style={{
                      boxShadow: ativo ? "0 0 0 2px #1c1a17" : "0 0 0 1px #e3dfd8",
                      opacity: !bandeira || ativo ? 1 : 0.5,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.logo} alt={b.valor} className="h-full w-full object-cover" />
                    {ativo && (
                      <span className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink shadow-sm">
                        <Icon name="check" size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <ChipGroup
            label="Meio do recebimento"
            options={MEIOS_RECEBIMENTO}
            value={meio}
            onChange={(v) => setMeio(v)}
          />
        </div>
      )}

      {tipo === "despesa" && (
        <div className="flex flex-col gap-[18px]">
          <CategoriaField
            categorias={categorias}
            value={categoriaId}
            onChange={setCategoriaId}
          />
          <div>
            <label className="mb-2 block text-[13px] font-bold text-ink-2">Credor / detalhamento</label>
            <input
              value={credor}
              onChange={(e) => setCredor(e.target.value)}
              placeholder="ex: Imobiliária Central"
              className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white px-4 text-base"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-[13px] font-bold text-ink-2">Vencimento</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white px-3 text-[15px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-[13px] font-bold text-ink-2">Mês ref.</label>
              <input
                value={mesRef}
                onChange={(e) => setMesRef(e.target.value)}
                placeholder="Julho/2026"
                className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white px-3 text-[15px]"
              />
            </div>
          </div>
        </div>
      )}

      {tipo === "capital" && (
        <div className="flex flex-col gap-[18px]">
          <ChipGroup
            label="Tipo de movimentação"
            options={[
              { value: "aporte", label: "Aporte" },
              { value: "devolucao", label: "Devolução de Capital" },
            ]}
            value={capKind}
            onChange={(v) => setCapKind(v as "aporte" | "devolucao")}
            fill
          />
          <div>
            <label className="mb-2 block text-[13px] font-bold text-ink-2">Descrição</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="ex: Aporte para reforma da loja"
              className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white px-4 text-base"
            />
          </div>
          <div className="rounded-[10px] bg-app px-4 py-3 text-[12.5px] leading-[1.5] text-muted">
            Movimentações de capital (aportes e retiradas dos sócios) aparecem na tela{" "}
            <b className="text-ink-2">Capital</b> e não entram no resultado operacional do DRE.
          </div>
        </div>
      )}

      {/* Data — a linha inteira abre o calendário */}
      <label className="relative mt-[18px] flex cursor-pointer items-center gap-3 rounded-[12px] border border-line bg-white px-4 py-3 shadow-card transition-colors hover:border-input-border">
        <Icon name="calendar" size={20} color="#8a857c" />
        <span className="flex-1">
          <span className="block text-[11.5px] font-bold uppercase tracking-[.1em] text-faint">
            Data
          </span>
          <span className="mt-0.5 block text-[15px] font-bold">
            {isoParaBR(data)}
            {data === hojeIso() && (
              <span className="ml-2 rounded-full bg-venda-bg px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[.06em] text-venda-fg">
                hoje
              </span>
            )}
          </span>
        </span>
        <span className="text-[13px] font-semibold text-[#4a6b8a]">Alterar</span>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value || hojeIso())}
          onClick={(e) => {
            // Abre o calendário nativo ao tocar em qualquer lugar da linha
            try {
              (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
            } catch {
              /* navegadores sem showPicker abrem no foco */
            }
          }}
          aria-label="Data do lançamento"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </>
  );

  if (modo === "gestor") {
    return (
      <div className="mx-auto max-w-[700px]">
        <div className="rounded-card border border-line bg-white p-4 shadow-card sm:p-6">
          <TipoSelector tipos={tiposDisponiveis} tipo={tipo} setTipo={setTipo} />
          {hintRow}

          <div className="mt-[18px] grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <div className={tipo === "venda" || tipo === "recebimento" ? "" : "sm:col-span-2"}>
              <label className="mb-2 block text-[13px] font-bold text-ink-2">Valor</label>
              <div className="flex h-14 items-center rounded-[12px] border border-input-border bg-white px-4">
                <span className="mr-1 text-lg font-bold text-muted">R$</span>
                <input
                  value={centsDisplay(valorCents)}
                  onChange={(e) => setValorCents(digitsDe(e.target.value))}
                  inputMode="numeric"
                  placeholder="0,00"
                  className="w-full bg-transparent text-2xl font-extrabold tracking-[-.01em] tnum outline-none"
                  style={{ color: cor }}
                />
              </div>
            </div>
            {(tipo === "venda" || tipo === "recebimento") && (
              <div>
                <label className="mb-2 block text-[13px] font-bold text-ink-2">Registrado por</label>
                <select
                  value={registradoPor}
                  onChange={(e) => setRegistradoPor(e.target.value)}
                  className="select-reset focus-ring h-14 w-full rounded-[12px] border border-input-border bg-white px-4 text-[15px] font-semibold"
                >
                  <option value="gestor">Gestor</option>
                  {vendedoras.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-[18px]">{camposAdaptativos}</div>

          {erro && (
            <div className="mt-4 rounded-[12px] border border-[#eccec5] bg-desp-bg px-4 py-3 text-sm font-semibold text-desp-fg">
              {erro}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-[52px] rounded-[12px] border border-input-border bg-white px-6 text-[15px] font-bold text-ink-2"
            >
              Cancelar
            </button>
            {podeExcluir && (
              <button
                type="button"
                onClick={() => setConfirmaExcluir(true)}
                className="flex h-[52px] items-center gap-2 rounded-[12px] border border-[#eccec5] bg-[#fbf1ee] px-5 text-[15px] font-bold text-desp-fg"
              >
                <Icon name="trash" size={18} /> Excluir
              </button>
            )}
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || valor <= 0}
              className="flex-1 rounded-[12px] text-[15.5px] font-bold text-white disabled:opacity-50"
              style={{ background: cor }}
            >
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Salvar lançamento"}
            </button>
          </div>
        </div>

        <Modal open={confirmaExcluir} onClose={() => setConfirmaExcluir(false)}>
          <div className="text-[19px] font-extrabold">Excluir lançamento?</div>
          <div className="mt-2 text-sm leading-[1.5] text-ink-3">
            Essa ação não pode ser desfeita.
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setConfirmaExcluir(false)}
              className="h-12 flex-1 rounded-[11px] border border-input-border bg-white text-[14.5px] font-bold text-ink-2"
            >
              Cancelar
            </button>
            <button
              onClick={excluir}
              className="h-12 flex-1 rounded-[11px] bg-desp-fg text-[14.5px] font-bold text-white"
            >
              Excluir
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // ---- modo vendedora (mobile, com teclado) --------------------------------
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 px-1 pb-6">
        <TipoSelector tipos={tiposDisponiveis} tipo={tipo} setTipo={setTipo} />
        {hintRow}

        <div className="mb-5 mt-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[.16em] text-faint">
            Valor do lançamento
          </div>
          <div
            className="mt-1.5 text-[clamp(40px,13vw,54px)] font-extrabold leading-none tracking-[-.02em] tnum transition-colors"
            style={{ color: valor > 0 ? cor : "#cbc6bd" }}
          >
            {brl(valor)}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2.5">
          {keypad.map((k) => {
            const util = k === "C" || k === "⌫";
            return (
              <button
                key={k}
                type="button"
                onClick={() => (k === "C" ? limpaValor() : k === "⌫" ? apagaDigito() : apertaDigito(k))}
                className={
                  "flex h-[58px] items-center justify-center rounded-[15px] text-[23px] font-bold transition-all active:scale-[.94] " +
                  (util
                    ? "bg-[#eae6df] text-ink-2 active:bg-[#e0dbd2]"
                    : "border border-line bg-white text-ink shadow-[0_1px_2px_rgba(40,36,30,.05)] active:bg-[#f4f1ec]")
                }
                style={k === "C" ? { color: "#b04a34" } : undefined}
                aria-label={k === "⌫" ? "Apagar" : k === "C" ? "Limpar" : k}
              >
                {k === "⌫" ? <Icon name="backspace" size={23} /> : k}
              </button>
            );
          })}
        </div>

        {camposAdaptativos}

        {erro && (
          <div className="mt-4 rounded-[12px] border border-[#eccec5] bg-desp-bg px-4 py-3 text-sm font-semibold text-desp-fg">
            {erro}
          </div>
        )}

        {podeExcluir && (
          <button
            type="button"
            onClick={() => setConfirmaExcluir(true)}
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] border border-[#eccec5] bg-[#fbf1ee] text-[15px] font-bold text-desp-fg"
          >
            <Icon name="trash" size={18} /> Excluir lançamento
          </button>
        )}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-app from-70% to-transparent px-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando || valor <= 0}
          className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-[16px] text-[16.5px] font-bold text-white shadow-[0_14px_26px_-12px_rgba(28,26,23,.5)] transition-transform active:scale-[.99] disabled:opacity-50"
          style={{ background: cor }}
        >
          {salvando ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Salvando…
            </>
          ) : (
            <>
              <Icon name="check" size={19} color="#fff" strokeWidth={2.4} />
              {editando ? "Salvar alterações" : "Salvar lançamento"}
            </>
          )}
        </button>
      </div>

      <BottomSheet open={confirmaExcluir} onClose={() => setConfirmaExcluir(false)}>
        <div className="text-center text-xl font-extrabold">Excluir lançamento?</div>
        <div className="mt-2 text-center text-[14.5px] leading-[1.5] text-ink-3">
          Essa ação não pode ser desfeita.
        </div>
        <button
          onClick={excluir}
          className="mt-6 h-[54px] w-full rounded-[13px] bg-desp-fg text-base font-bold text-white"
        >
          Sim, excluir
        </button>
        <button
          onClick={() => setConfirmaExcluir(false)}
          className="mt-1.5 h-[52px] w-full rounded-[13px] text-[15px] font-bold text-ink-2"
        >
          Cancelar
        </button>
      </BottomSheet>
    </div>
  );
}

// ---- Campo de cliente: busca inteligente + cadastro rápido ------------------
// Busca sem acento/caixa e por várias palavras ("ana sil" acha "Ana Silva").
// Ao focar com o campo vazio, lista as clientes cadastradas para escolher.
// O botão "Cadastrar" só aparece quando não há correspondência exata, para
// empurrar o reúso da mesma grafia e evitar a mesma cliente escrita de N formas.
function ClienteField({
  label,
  placeholder = "Buscar ou cadastrar cliente",
  valor,
  onChange,
  clientes,
  onCadastrada,
}: {
  label: string;
  placeholder?: string;
  valor: string;
  onChange: (v: string) => void;
  clientes: Cliente[];
  onCadastrada: (c: Cliente) => void;
}) {
  const toast = useToast();
  const [aberto, setAberto] = React.useState(false);
  const [cadastrando, setCadastrando] = React.useState(false);
  const [telefone, setTelefone] = React.useState("");
  const [salvandoCad, setSalvandoCad] = React.useState(false);

  const norm = normalizarBusca(valor);

  // Ordena por relevância: exato > começa com > contém; empate por nome (pt-BR).
  const encontradas = React.useMemo(() => {
    const base = clientes.map((c) => ({ c, n: normalizarBusca(c.nome) }));
    const tokens = norm.split(" ").filter(Boolean);
    const filtradas = tokens.length
      ? base.filter(({ n }) => tokens.every((t) => n.includes(t)))
      : base;
    const rank = (n: string) => (n === norm ? 0 : n.startsWith(norm) ? 1 : 2);
    return filtradas
      .sort(
        (a, b) => rank(a.n) - rank(b.n) || a.c.nome.localeCompare(b.c.nome, "pt-BR"),
      )
      .map(({ c }) => c);
  }, [clientes, norm]);

  // A cliente digitada já existe com a mesma grafia (ignorando acento/caixa)?
  const jaCadastrada =
    norm.length > 0 && clientes.some((c) => normalizarBusca(c.nome) === norm);
  const podeCadastrar = norm.length >= 2 && !jaCadastrada;
  const temParecidas = encontradas.length > 0;

  // Navegando (campo vazio) mostra todas com rolagem; buscando, as 8 melhores.
  const lista = norm ? encontradas.slice(0, 8) : encontradas;

  async function cadastrar() {
    setSalvandoCad(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: valor.trim(), telefone }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast(d.erro || "Não foi possível cadastrar", "erro");
        return;
      }
      onCadastrada(d.cliente);
      onChange(d.cliente.nome);
      toast(d.jaExistia ? "Cliente já estava cadastrada" : "Cliente cadastrada");
      setCadastrando(false);
      setTelefone("");
      setAberto(false);
    } catch {
      toast("Sem conexão", "erro");
    } finally {
      setSalvandoCad(false);
    }
  }

  function selecionar(nome: string) {
    onChange(nome);
    setAberto(false);
    setCadastrando(false);
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-[13px] font-bold text-ink-2">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <Icon name="search" size={18} color="#a39d92" />
        </span>
        <input
          value={valor}
          onChange={(e) => {
            onChange(e.target.value);
            setAberto(true);
            setCadastrando(false);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 180)}
          placeholder={placeholder}
          autoComplete="off"
          className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white pl-11 pr-10 text-base"
        />
        {jaCadastrada && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
            <Icon name="check" size={19} color="#2f7d5b" strokeWidth={2.4} />
          </span>
        )}
      </div>

      {jaCadastrada && !aberto && (
        <div className="mt-1.5 flex items-center gap-1 px-0.5 text-[12px] font-semibold text-venda-fg">
          <Icon name="check" size={13} color="#2f7d5b" strokeWidth={2.6} />
          Cliente cadastrada
        </div>
      )}

      {!jaCadastrada && norm.length > 0 && !aberto && (
        <div className="mt-1.5 flex items-center gap-1 px-0.5 text-[12px] font-semibold text-desp-fg">
          <Icon name="alert" size={13} color="#b04a34" strokeWidth={2.4} />
          Cliente não cadastrada — cadastre ou selecione uma da lista
        </div>
      )}

      {aberto && !cadastrando && (lista.length > 0 || podeCadastrar) && (
        <div className="absolute left-0 right-0 top-[80px] z-20 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_12px_28px_-10px_rgba(0,0,0,.22)]">
          {!norm && lista.length > 0 && (
            <div className="border-b border-[#f2efe9] bg-panel px-4 py-2 text-[11px] font-bold uppercase tracking-[.1em] text-faint">
              {lista.length === 1 ? "1 cliente" : `${lista.length} clientes`} — toque para escolher
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto">
            {lista.map((c) => {
              const exata = norm.length > 0 && normalizarBusca(c.nome) === norm;
              return (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selecionar(c.nome);
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-[#f2efe9] px-4 py-3 text-left last:border-0 hover:bg-app active:bg-app"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#f2efe9] text-[12px] font-extrabold text-ink-3">
                      {iniciais(c.nome)}
                    </span>
                    <span className="truncate text-[15px] font-semibold">{c.nome}</span>
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    {c.telefone && (
                      <span className="text-[12px] font-medium text-faint">{c.telefone}</span>
                    )}
                    {exata && <Icon name="check" size={16} color="#2f7d5b" strokeWidth={2.4} />}
                  </span>
                </button>
              );
            })}
          </div>
          {podeCadastrar && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setCadastrando(true);
                setAberto(false);
              }}
              className="flex w-full items-center gap-2 border-t border-[#f2efe9] bg-panel px-4 py-3 text-left text-[14px] font-bold text-venda-fg hover:bg-venda-bg"
            >
              <Icon name="plus" size={15} color="#2f7d5b" strokeWidth={2.4} />
              {temParecidas ? "Nenhuma dessas? Cadastrar" : "Cadastrar"} “{valor.trim()}”
            </button>
          )}
        </div>
      )}

      {cadastrando && (
        <div className="mt-2.5 flex flex-col gap-2.5 rounded-[12px] border border-[#dfe9df] bg-[#f4f9f6] p-3.5">
          <div className="text-[12.5px] font-bold text-ink-2">
            Cadastrar “{valor.trim()}”
          </div>
          <input
            value={telefone}
            onChange={(e) => setTelefone(mascaraTelefoneBR(e.target.value))}
            inputMode="tel"
            maxLength={15}
            placeholder="Telefone (opcional) — (11) 91234-5678"
            className="focus-ring h-11 w-full rounded-[10px] border border-input-border bg-white px-3.5 text-[14px]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCadastrando(false)}
              className="h-10 rounded-[10px] border border-input-border bg-white px-4 text-[13px] font-bold text-ink-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={cadastrar}
              disabled={salvandoCad}
              className="h-10 flex-1 rounded-[10px] bg-venda-fg text-[13px] font-bold text-white disabled:opacity-60"
            >
              {salvandoCad ? "Salvando…" : "Salvar cadastro"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Campo de categoria: busca + agrupado por grupo do DRE ------------------
function CategoriaField({
  categorias,
  value,
  onChange,
}: {
  categorias: { id: string; nome: string; grupo?: DreGrupo | null }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [aberto, setAberto] = React.useState(false);
  const [busca, setBusca] = React.useState("");
  const selecionada = categorias.find((c) => c.id === value);

  const q = normalizarBusca(busca);
  const filtradas = q
    ? categorias.filter((c) => normalizarBusca(c.nome).includes(q))
    : categorias;

  // Agrupa por grupo do DRE, na ordem canônica dos grupos; nomes ordenados A→Z.
  const grupos = React.useMemo(() => {
    const ordem = Object.keys(DRE_GRUPO_LABEL) as DreGrupo[];
    const porGrupo = new Map<string, typeof categorias>();
    for (const c of filtradas) {
      const k = c.grupo ?? "outros";
      const arr = porGrupo.get(k) ?? [];
      arr.push(c);
      porGrupo.set(k, arr);
    }
    return [...porGrupo.keys()]
      .sort((a, b) => ordem.indexOf(a as DreGrupo) - ordem.indexOf(b as DreGrupo))
      .map((k) => ({
        chave: k,
        label: DRE_GRUPO_LABEL[k as DreGrupo] ?? "Outros",
        itens: [...(porGrupo.get(k) ?? [])].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        ),
      }));
  }, [filtradas]);

  function escolher(id: string) {
    onChange(id);
    setAberto(false);
    setBusca("");
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-[13px] font-bold text-ink-2">Categoria</label>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="focus-ring flex h-[52px] w-full items-center justify-between gap-2 rounded-[12px] border border-input-border bg-white px-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span
            className={
              "block truncate text-base " +
              (selecionada ? "font-semibold text-ink" : "text-faint")
            }
          >
            {selecionada ? selecionada.nome : "Selecione a categoria"}
          </span>
          {selecionada?.grupo && (
            <span className="block truncate text-[11.5px] font-semibold text-faint">
              {DRE_GRUPO_LABEL[selecionada.grupo]}
            </span>
          )}
        </span>
        <Icon name="chevronDown" size={18} color="#8a857c" />
      </button>

      {aberto && (
        <>
          {/* clique fora fecha */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 right-0 top-[80px] z-20 overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_16px_36px_-12px_rgba(0,0,0,.25)]">
            <div className="border-b border-[#f2efe9] p-2.5">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="search" size={17} color="#a39d92" />
                </span>
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar categoria…"
                  className="focus-ring h-11 w-full rounded-[10px] border border-input-border bg-white pl-10 pr-3 text-[15px]"
                />
              </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto py-1">
              {grupos.length === 0 && (
                <div className="px-4 py-7 text-center text-[13px] text-faint">
                  Nenhuma categoria encontrada
                </div>
              )}
              {grupos.map((g) => (
                <div key={g.chave}>
                  <div className="sticky top-0 z-[1] bg-panel px-4 py-1.5 text-[11px] font-bold uppercase tracking-[.08em] text-faint">
                    {g.label}
                  </div>
                  {g.itens.map((c) => {
                    const ativa = c.id === value;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => escolher(c.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-app active:bg-app"
                      >
                        <span
                          className={
                            "text-[15px] " +
                            (ativa ? "font-bold text-ink" : "font-medium text-ink-2")
                          }
                        >
                          {c.nome}
                        </span>
                        {ativa && (
                          <Icon name="check" size={17} color="#2f7d5b" strokeWidth={2.4} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---- subcomponentes ----------------------------------------------------------
function TipoSelector({
  tipos,
  tipo,
  setTipo,
}: {
  tipos: { key: TipoForm; label: string }[];
  tipo: TipoForm;
  setTipo: (t: TipoForm) => void;
}) {
  // 4 abas (gestor) quebram em 2×2 no celular e viram 1×4 no desktop; 3 abas
  // (vendedora) ficam sempre em uma linha. Evita rótulos longos se sobreporem.
  const cols = tipos.length > 3 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3";
  return (
    <div className={`grid gap-1.5 rounded-[13px] bg-[#efece5] p-1.5 ${cols}`}>
      {tipos.map((t) => {
        const ativo = t.key === tipo;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => setTipo(t.key)}
            className="h-[42px] whitespace-nowrap rounded-[9px] text-[13px] font-bold transition-colors sm:text-[13.5px]"
            style={{
              background: ativo ? "#fff" : "transparent",
              color: ativo ? "#1c1a17" : "#6f6a63",
              boxShadow: ativo ? "0 1px 3px rgba(40,36,30,.12)" : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
  fill = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  fill?: boolean;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-[13px] font-bold text-ink-2">{label}</label>
      <div className={fill ? "flex gap-2" : "flex flex-wrap gap-2"}>
        {options.map((o) => {
          const ativo = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={
                (fill
                  ? "h-11 flex-1 rounded-[11px] px-1 text-[12.5px]"
                  : "h-10 rounded-full px-[15px] text-[13.5px]") +
                " whitespace-nowrap font-semibold transition-colors"
              }
              style={{
                border: `1px solid ${ativo ? "#1c1a17" : "#e3dfd8"}`,
                background: ativo ? "#1c1a17" : "#fff",
                color: ativo ? "#fff" : "#42403b",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
