import { handle, jsonOk } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return jsonOk({ ok: true, redirect: "/login" });
  });
}
