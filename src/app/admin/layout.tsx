import { Sidebar } from "@/components/layout/Sidebar";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = ((user?.app_metadata?.role ?? user?.user_metadata?.role) as string) || "admin";
  const userName = (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || "Usuario";
  const userEmail = user?.email || "";

  return (
    <div className="flex min-h-screen bg-[#081428]">
      <Sidebar role={role} userName={userName} userEmail={userEmail} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
