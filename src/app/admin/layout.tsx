import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

// El chequeo de sesión corre dentro de Suspense para no bloquear el primer
// render: el shell del panel y los loading.tsx de cada página aparecen al
// instante mientras se resuelve. La autorización real de datos vive en cada
// página y route handler (requireAccess), así que esto no debilita seguridad.
async function SidebarGate() {
  const access = await getAccess();
  if (!access) redirect("/admin/login");
  return (
    <Sidebar role={access.role} userName={access.name} userEmail={access.email} />
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#081428]">
      <Suspense
        fallback={
          <aside className="hidden lg:flex w-60 min-h-screen bg-[#0e1d38] border-r border-white/[0.06] flex-shrink-0" />
        }
      >
        <SidebarGate />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
