import { redirect } from "next/navigation";
import { verifyAdminCookie, logoutAdmin } from "../actions";
import { Button } from "@/components/ui/button";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await verifyAdminCookie();
  if (!ok) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-medium">Admin</span>
        <form action={logoutAdmin}>
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
