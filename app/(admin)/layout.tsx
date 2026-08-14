import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { Logo } from "@/components/logo";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    redirect(admin.status === 401 ? "/sign-in?callbackUrl=/admin" : "/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-base text-text-primary">
      <div className="glass-ambient" aria-hidden />
      <header className="sticky top-0 z-20 glass-nav">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo href="/dashboard" className="h-7" />
            <span className="rounded-full border border-border-default bg-brand-light px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-brand-primary">
              Admin
            </span>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
