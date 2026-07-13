import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseConfigurado, supabaseUrl } from "../env";

const PUBLIC_PREFIXES = [
  "/login",
  "/primeiro-acesso",
  "/api/auth",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/offline",
];

function isPublic(path: string): boolean {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path.startsWith(p));
}

// Atualiza a sessão do Supabase (cookies) e aplica as guardas de rota por papel.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem configuração do Supabase ainda: não bloquear (permite ver /login etc.)
  if (!supabaseConfigurado()) return response;

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const role = (user?.app_metadata?.role as string | undefined) ?? undefined;

  // Usuário logado tentando acessar login/primeiro-acesso → manda pra home
  if (user && (path === "/login" || path === "/primeiro-acesso")) {
    return redirect(request, role === "gestor" ? "/admin" : "/app");
  }

  // Raiz → home conforme papel (ou login)
  if (path === "/") {
    if (!user) return redirect(request, "/login");
    return redirect(request, role === "gestor" ? "/admin" : "/app");
  }

  if (isPublic(path)) return response;

  // Rotas protegidas
  if (!user) return redirect(request, "/login");

  if (path.startsWith("/admin") && role !== "gestor") {
    return redirect(request, "/app");
  }
  if (path.startsWith("/app") && role === "gestor") {
    return redirect(request, "/admin");
  }

  return response;
}

function redirect(request: NextRequest, to: string) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";
  return NextResponse.redirect(url);
}
