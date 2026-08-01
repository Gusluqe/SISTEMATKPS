import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname to server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // app_metadata solo lo puede escribir el service_role; user_metadata queda
  // como fallback para usuarios viejos
  const role = (user?.app_metadata?.role ?? user?.user_metadata?.role) as
    | string
    | undefined;

  if (pathname.startsWith("/api")) {
    // Endpoints públicos: crear ticket y subir adjunto (formulario), calificar
    // desde el email (protegido por token firmado) y el cron (protegido por clave)
    const isPublic =
      (request.method === "POST" &&
        (pathname === "/api/tickets" || pathname === "/api/attachments")) ||
      (request.method === "GET" &&
        (/^\/api\/tickets\/[^/]+\/rating$/.test(pathname) || pathname === "/api/cron"));

    if (!isPublic && !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return response;
  }

  if (!user && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (user && pathname === "/admin/login") {
    const dest = role === "technician" ? "/admin/tickets" : "/admin/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Technicians can only access /admin/tickets
  if (user && role === "technician") {
    const allowed = pathname.startsWith("/admin/tickets");
    if (!allowed) {
      return NextResponse.redirect(new URL("/admin/tickets", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
