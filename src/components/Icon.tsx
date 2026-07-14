// Ícones de traço (stroke), viewBox 0 0 24 24. Sem emojis. Ver design/README §9.
import * as React from "react";

const PATHS: Record<string, string[]> = {
  plus: ["M12 5v14", "M5 12h14"],
  back: ["M15 18l-6-6 6-6"],
  chevronRight: ["M9 6l6 6-6 6"],
  chevronDown: ["M6 9l6 6 6-6"],
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  home: ["M4 11 12 4l8 7", "M6 9.5V20h12V9.5", "M10 20v-6h4v6"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3.5 6h.01", "M3.5 12h.01", "M3.5 18h.01"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  trash: ["M4 7h16", "M9 7V4.5h6V7", "M6.5 7l1 13h9l1-13"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  calendar: ["M7 3v3", "M17 3v3", "M4 8.5h16", "M5 6h14v14H5z"],
  alert: ["M12 8.5v5", "M12 17.2h.01", "M12 3 21 20H3z"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  tag: [
    "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-6.2-6.2A2 2 0 0 1 3.8 13V5a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l6.4 6.4a2 2 0 0 1 0 2.4z",
    "M8 8h.01",
  ],
  banknote: ["M4 9.5h16V18H4z", "M3.5 9.5 12 4.5l8.5 5", "M8.5 18v-4", "M15.5 18v-4", "M12 18v-4"],
  arrowOut: ["M8 16 16 8", "M9 8h7v7"],
  chart: ["M4 20V5", "M4 20h15", "M8.5 20v-5", "M13 20v-9", "M17.5 20v-6"],
  users: [
    "M9 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4",
    "M3.5 19c.8-2.8 2.9-4.2 5.5-4.2s4.7 1.4 5.5 4.2",
    "M16 5.1a3.2 3.2 0 0 1 0 6.2",
    "M17.5 19c-.3-1.9-1.1-3.2-2.3-4.1",
  ],
  download: ["M12 4v10", "M8.5 10.5 12 14l3.5-3.5", "M5 19h14"],
  copy: ["M9 9.5h9.5V19H9z", "M6 14.5H4.5V5H14v1.5"],
  gear: ["M4 7h9", "M4 12h3", "M4 17h11", "M13 5v4", "M7 10v4", "M15 15v4", "M13 7h7", "M7 12h13", "M15 17h5"],
  wallet: [
    "M4 8.5h14.5a1.5 1.5 0 0 1 1.5 1.5V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z",
    "M4 8.5V6.5a1 1 0 0 1 1-1h11",
    "M16.5 13.5h.01",
  ],
  arrowRight: ["M5 12h14", "M13 6l6 6-6 6"],
  backspace: ["M9 6 3 12l6 6", "M9 6h11v12H9", "M13 10l4 4", "M17 10l-4 4"],
  wifi: ["M5 12.5a10 10 0 0 1 14 0", "M8.5 16a5 5 0 0 1 7 0", "M12 19.5h.01"],
  trophy: ["M8 4h8v4a4 4 0 0 1-8 0z", "M8 6H5v1a3 3 0 0 0 3 3", "M16 6h3v1a3 3 0 0 1-3 3", "M10 14h4", "M9 20h6", "M12 14v6"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"],
  help: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    "M9.4 9.2a2.7 2.7 0 1 1 3.8 2.5c-.8.4-1.2 1-1.2 1.9",
    "M12 17h.01",
  ],
  eye: [
    "M1.8 12S5.2 5 12 5s10.2 7 10.2 7-3.4 7-10.2 7S1.8 12 1.8 12z",
    "M12 15.1a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2z",
  ],
  eyeOff: [
    "M3 3l18 18",
    "M10.6 10.6a3 3 0 0 0 4.24 4.24",
    "M9.4 5.2A10.5 10.5 0 0 1 12 5c6.8 0 10.2 7 10.2 7a17.7 17.7 0 0 1-3.3 4.3",
    "M6.6 6.6A17.6 17.6 0 0 0 1.8 12S5.2 19 12 19a10.3 10.3 0 0 0 3.2-.5",
  ],
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.9,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const d = PATHS[name] || [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {d.map((path, i) => (
        <path key={i} d={path} />
      ))}
    </svg>
  );
}

/** Ícone correspondente ao tipo de lançamento. */
export function iconeDoTipo(tipo: string): IconName {
  if (tipo === "venda") return "tag";
  if (tipo === "recebimento") return "banknote";
  if (tipo === "despesa") return "arrowOut";
  if (tipo === "investimento") return "wallet";
  if (tipo === "devolucao_capital") return "arrowOut";
  return "tag";
}
