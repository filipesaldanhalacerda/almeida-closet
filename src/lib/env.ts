// Acesso centralizado às variáveis de ambiente, com mensagens claras.
// Erros só disparam em tempo de execução (não quebram o `next build`).

export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada. Veja o README.");
  return v;
}

export function supabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v)
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada. Veja o README.");
  return v;
}

export function supabaseServiceRoleKey(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada. Veja o README.");
  return v;
}

/** Domínio do e-mail sintético interno usado pela autenticação por usuário. */
export function authEmailDomain(): string {
  return process.env.AUTH_EMAIL_DOMAIN || "almeidacloset.local";
}

/** Monta o e-mail sintético a partir do nome de usuário. */
export function usernameParaEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${authEmailDomain()}`;
}

/** Indica se as variáveis públicas do Supabase estão presentes. */
export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
