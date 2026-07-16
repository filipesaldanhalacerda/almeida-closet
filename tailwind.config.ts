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
        ink: "#1a2130", // navy-charcoal (texto / superfície escura)
        "ink-2": "#3a4354", // texto médio
        "ink-3": "#5a6273", // texto médio 2
        muted: "#727a88", // auxiliar (AA)
        faint: "#8b929e", // texto fraco
        "faint-2": "#9aa1ab",
        "faint-3": "#757c8b", // micro texto legível
        surface: "#ffffff", // card
        app: "#f4efe7", // marfim quente (fundo)
        line: "#e9e2d6", // borda de card
        "line-2": "#efe9df",
        "input-border": "#e2dacd",
        "input-border-2": "#e6dfd2",
        panel: "#faf6ef", // superfície secundária
        // Marca: coral (ação primária) + navy profundo (heros/superfícies escuras)
        accent: "#e8674c",
        "accent-press": "#cf5138",
        "accent-soft": "#fbe6df",
        night: "#1e2740",
        "night-2": "#151c2e",
        // Venda / Receita (verde)
        "venda-fg": "#1f875c",
        "venda-bg": "#e5f1ea",
        // Recebimento (teal)
        "receb-fg": "#127c84",
        "receb-bg": "#ddeff0",
        // Despesa (vermelho)
        "desp-fg": "#cb4a44",
        "desp-bg": "#fae7e3",
        // Capital (âmbar)
        capital: "#96683a",
        // Selo de variação positiva
        "delta-fg": "#1f875c",
        "delta-bg": "#e8f1ec",
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        // Easing natural padrão (material standard) para transições de UI.
        swift: "cubic-bezier(.4,0,.2,1)",
      },
      borderRadius: {
        input: "14px",
        card: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,33,48,.04), 0 12px 28px -18px rgba(26,33,48,.20)",
        lift: "0 2px 6px rgba(26,33,48,.06), 0 22px 48px -24px rgba(26,33,48,.30)",
        primary: "0 14px 30px -12px rgba(232,103,76,.5)",
        night: "0 22px 48px -18px rgba(20,26,46,.55)",
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
