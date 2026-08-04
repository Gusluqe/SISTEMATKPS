import { Sidebar } from "@/components/layout/Sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";

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

  const access = await getAccess();
  if (!access) redirect("/admin/login");

  const role = access.role;
  const userName = access.name;
  const userEmail = access.email;

  return (
    <div className="flex min-h-screen bg-[#081428]">
      <Sidebar role={role} userName={userName} userEmail={userEmail} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
