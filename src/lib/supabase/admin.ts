import { createClient } from "@supabase/supabase-js";
import { supabaseServiceRoleKey, supabaseUrl } from "../env";

// Cliente com a chave service_role, IGNORA RLS. Uso EXCLUSIVO no servidor
// (route handlers e scripts): criação de usuários, validação de convites, seed.
// NUNCA importar em componentes client.
export function createAdminClient() {
  return createClient(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
