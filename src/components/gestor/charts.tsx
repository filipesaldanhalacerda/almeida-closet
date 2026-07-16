import { pct } from "@/lib/format";

/** Sparkline (linha) a partir de uma série de valores. */
export function Sparkline({
  values,
  width = 200,
  height = 56,
  color = "#8fd6b4",
  strokeWidth = 2.5,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (width - pad * 2) + pad;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" className="h-auto max-w-full">
      <polyline points={pts} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Selo de variação percentual (verde/vermelho conforme "bom"). */
export function DeltaBadge({ valor, bom }: { valor: number; bom: boolean }) {
  const sinal = valor >= 0 ? "+" : "−";
  return (
    <span
      className="rounded-full px-2.5 py-[3px] text-[11.5px] font-bold"
      style={{
        background: bom ? "#edf3ee" : "#f7e8e2",
        color: bom ? "#1f875c" : "#cb4a44",
      }}
    >
      {sinal}
      {pct(Math.abs(valor), 1)}
    </span>
  );
}

/** Linha de barra horizontal (ranking / breakdown). */
export function HBar({ largura, cor }: { largura: number; cor: string }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#efece5]">
      <div
        className="h-full rounded-[4px] transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, largura))}%`, background: cor }}
      />
    </div>
  );
}

/** Card-resumo padrão dos relatórios (DRE, Fluxo, Capital). */
export function StatCard({
  titulo,
  valor,
  cor,
  dark,
  sub,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  dark?: boolean;
  sub?: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-[13px] border p-4 " +
        (dark ? "border-transparent bg-ink" : "border-line bg-white shadow-card")
      }
    >
      <div className="text-xs font-bold" style={{ color: dark ? "rgba(255,255,255,.6)" : "#727a88" }}>
        {titulo}
      </div>
      <div
        className="mt-1.5 text-[18px] font-extrabold tnum sm:text-[20px]"
        style={{ color: dark ? "#fff" : cor || "#1a2130" }}
      >
        {valor}
      </div>
      {sub && <div className="mt-1 text-[11.5px] font-semibold">{sub}</div>}
    </div>
  );
}

/** Comparativo "vs período anterior" para usar dentro de StatCard. */
export function StatDelta({
  atual,
  anterior,
  rotulo,
  bomSeMaior = true,
  dark,
}: {
  atual: number;
  anterior: number;
  rotulo: string;
  bomSeMaior?: boolean;
  dark?: boolean;
}) {
  if (anterior === 0) {
    return <span style={{ color: dark ? "rgba(255,255,255,.45)" : "#757c8b" }}>{rotulo}: —</span>;
  }
  const delta = ((atual - anterior) / Math.abs(anterior)) * 100;
  const bom = bomSeMaior ? delta >= 0 : delta <= 0;
  const corTexto = dark ? (bom ? "#8fd6b4" : "#e6a993") : bom ? "#1f875c" : "#cb4a44";
  return (
    <span style={{ color: corTexto }}>
      {delta >= 0 ? "▲" : "▼"} {pct(Math.abs(delta), 0)}{" "}
      <span style={{ color: dark ? "rgba(255,255,255,.45)" : "#757c8b" }}>{rotulo}</span>
    </span>
  );
}
