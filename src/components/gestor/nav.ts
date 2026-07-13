import type { IconName } from "@/components/Icon";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  titulo: string;
  /** true = corresponde exatamente ao href (não por prefixo) */
  exact?: boolean;
}

export interface NavGroup {
  titulo: string;
  itens: NavItem[];
}

// Menu do gestor, agrupado por área. "Novo lançamento" não entra aqui — já há
// o botão fixo no topo. "Relatório mensal" foi removido por ser redundante com
// o Dashboard.
export const NAV_GROUPS: NavGroup[] = [
  {
    titulo: "Geral",
    itens: [{ href: "/admin", label: "Dashboard", icon: "home", titulo: "Dashboard", exact: true }],
  },
  {
    titulo: "Movimentações",
    itens: [
      { href: "/admin/lancamentos", label: "Lançamentos", icon: "list", titulo: "Lançamentos" },
      { href: "/admin/capital", label: "Capital", icon: "banknote", titulo: "Capital — investimentos e devoluções" },
    ],
  },
  {
    titulo: "Relatórios",
    itens: [
      { href: "/admin/dre", label: "DRE anual", icon: "chart", titulo: "DRE anual" },
      { href: "/admin/fluxo-de-caixa", label: "Fluxo de caixa", icon: "wallet", titulo: "Fluxo de caixa" },
      { href: "/admin/resultado-de-vendas", label: "Resultado de vendas", icon: "tag", titulo: "Resultado de vendas" },
      { href: "/admin/relatorios", label: "Relatórios", icon: "download", titulo: "Relatórios" },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      { href: "/admin/equipe", label: "Equipe", icon: "users", titulo: "Equipe" },
      { href: "/admin/configuracoes", label: "Configurações", icon: "gear", titulo: "Configurações" },
    ],
  },
];

// Lista achatada para buscas de título/ativo.
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.itens);

export function tituloDaRota(pathname: string): string {
  // rotas específicas de lançamento primeiro
  if (pathname === "/admin/lancamentos/novo") return "Novo lançamento";
  if (pathname.includes("/lancamentos/") && pathname.includes("/editar")) return "Editar lançamento";

  const exato = NAV.find((n) => n.exact && n.href === pathname);
  if (exato) return exato.titulo;
  const prefixo = [...NAV]
    .filter((n) => !n.exact)
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname.startsWith(n.href));
  return prefixo?.titulo ?? "Almeida Closet";
}

export function itemAtivo(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  if (item.href === "/admin/lancamentos") {
    return pathname.startsWith("/admin/lancamentos") && !pathname.startsWith("/admin/lancamentos/novo");
  }
  return pathname.startsWith(item.href);
}
