import type { Config } from "tailwindcss";

/**
 * Design tokens do Almeida Closet (ver design/README.md seção 9).
 * Paleta neutra e sóbria, white-label. Cores semânticas:
 * receita/venda = verde, recebimento = teal, despesa = terracota.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    // Redefinição completa (não `extend`) para inserir o breakpoint `xs` na
    // ordem correta — senão o Tailwind o geraria por último e quebraria a
    // cascata mobile-first dos utilitários md:/lg:/xl:.
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        ink: "#1c1a17", // tinta principal (texto / botão primário)
        "ink-2": "#42403b", // texto médio
        "ink-3": "#6f6a63", // texto médio 2
        muted: "#8a857c", // auxiliar
        faint: "#a09a90", // texto fraco
        "faint-2": "#b0a99e",
        "faint-3": "#b4afa6", // placeholder
        surface: "#ffffff", // card
        app: "#f7f6f3", // fundo do app
        line: "#ece7df", // borda de card
        "line-2": "#eceae3",
        "input-border": "#e0ddd5",
        "input-border-2": "#e3dfd8",
        panel: "#faf9f6", // superfície secundária (sidebar, header de tabela)
        // Venda / Receita (verde)
        "venda-fg": "#2f7d5b",
        "venda-bg": "#e7f1ec",
        // Recebimento (teal)
        "receb-fg": "#2b6f74",
        "receb-bg": "#e2eff0",
        // Despesa (terracota)
        "desp-fg": "#b04a34",
        "desp-bg": "#f7e8e2",
        // Capital (âmbar neutro)
        capital: "#8c6f52",
        // Selo de variação positiva
        "delta-fg": "#2f7d5b",
        "delta-bg": "#edf3ee",
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        // Easing natural padrão (material standard) para transições de UI.
        swift: "cubic-bezier(.4,0,.2,1)",
      },
      borderRadius: {
        input: "12px",
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(40,36,30,.03), 0 14px 30px -22px rgba(40,36,30,.16)",
        primary: "0 12px 26px -12px rgba(28,26,23,.6)",
        modal: "0 40px 80px -30px rgba(0,0,0,.42), 0 0 0 1px rgba(0,0,0,.06)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(.4)", opacity: "0" },
          "55%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        toastin: {
          from: { transform: "translate(-50%,20px)", opacity: "0" },
          to: { transform: "translate(-50%,0)", opacity: "1" },
        },
        fadein: { from: { opacity: "0" }, to: { opacity: "1" } },
        sheetup: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        pop: "pop .55s cubic-bezier(.2,.9,.3,1.3)",
        toastin: "toastin .3s ease-out",
        fadein: "fadein .18s ease-out",
        sheetup: "sheetup .26s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
