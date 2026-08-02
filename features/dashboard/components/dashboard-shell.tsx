"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Pencil,
  Palette,
  Download,
  Eye,
  Settings,
  BarChart3,
  CreditCard,
  LogOut,
  User,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo, LogoMark, BetaBadge } from "@/components/logo";
import { siteConfig } from "@/lib/site";
import { Footer } from "@/features/landing/components/footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Edit", href: "/dashboard/edit", icon: Pencil },
  { title: "Templates", href: "/dashboard/templates", icon: Palette },
  { title: "Import", href: "/dashboard/import", icon: Download },
  { title: "Preview", href: "/dashboard/preview", icon: Eye },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
        {isCollapsed && !isMobile ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="group/logo relative mx-auto flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
            aria-label="Open sidebar"
          >
            <LogoMark className="h-8 w-8 shrink-0 transition-opacity duration-150 group-hover/logo:opacity-0" />
            <PanelLeft
              className="absolute h-5 w-5 text-text-primary opacity-0 transition-opacity duration-150 group-hover/logo:opacity-100"
              aria-hidden
            />
          </button>
        ) : (
          <Link
            href="/dashboard"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            className="flex h-8 items-center gap-2 overflow-hidden px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label={`${siteConfig.name} home`}
          >
            <LogoMark className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
            <span className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
              <span className="font-display text-lg font-bold text-brand-primary">
                {siteConfig.name}
              </span>
              <BetaBadge />
            </span>
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:p-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-1">
              {NAV.map(({ title, href, icon: Icon }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === href
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      tooltip={title}
                      className="gap-3 text-base [&_svg]:size-5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&_span]:hidden group-data-[collapsible=icon]:[&_svg]:size-5"
                    >
                      <Link
                        href={href}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon aria-hidden />
                        <span>{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border group-data-[collapsible=icon]:p-1">
        <div className="flex items-center gap-2 rounded-md p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:p-1">
          <Avatar className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback className="bg-brand-light text-brand-dark">
              {user?.name?.charAt(0)?.toUpperCase() ?? (
                <User className="h-4 w-4" aria-hidden />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-text-primary">
              {user?.name ?? "Your account"}
            </p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
            <ThemeToggle className="size-8 group-data-[collapsible=icon]:size-8" />
            <Button
              variant="ghost"
              size="icon-sm"
              className="group-data-[collapsible=icon]:size-8"
              aria-label="Sign out"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" aria-hidden />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardNavAutoCollapse() {
  const pathname = usePathname();
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }

    // Desktop: collapse only when navigating onto preview — not when the user toggles open.
    if (!pathname.startsWith("/dashboard/preview")) return;
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on route change only
  }, [pathname]);

  return null;
}

function DashboardHeader() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <header className="glass-nav sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-4">
      {(isMobile || !isCollapsed) && <SidebarTrigger className="size-9" />}
      <Logo href="/dashboard" className="md:hidden" showBeta />
      <div className="ml-auto flex items-center gap-1 md:hidden">
        <ThemeToggle className="size-9" />
      </div>
    </header>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter =
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/preview") ||
    pathname.startsWith("/dashboard/import");
  const fullHeightPanel =
    pathname.startsWith("/dashboard/edit") ||
    pathname.startsWith("/dashboard/preview");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <DashboardNavAutoCollapse />
      <SidebarInset
        className={
          fullHeightPanel
            ? "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-surface-base lg:h-svh lg:max-h-svh lg:overflow-hidden"
            : "relative min-w-0 overflow-x-hidden bg-surface-base"
        }
      >
        <DashboardHeader />
        <main
          className={
            fullHeightPanel
              ? "relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden p-[var(--space-5)] lg:overflow-hidden"
              : "relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden p-[var(--space-5)]"
          }
        >
          {children}
        </main>
        {!hideFooter ? <Footer /> : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
