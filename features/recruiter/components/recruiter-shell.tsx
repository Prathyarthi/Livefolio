"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Search,
  Settings,
  LogOut,
  User,
  PanelLeft,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark, BetaBadge } from "@/components/logo";
import { siteConfig } from "@/lib/site";
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
  { title: "Home", href: "/recruiter", icon: LayoutDashboard },
  { title: "Search", href: "/recruiter/search", icon: Search },
  { title: "Settings", href: "/recruiter/settings", icon: Settings },
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
            href="/recruiter"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            className="flex h-8 items-center gap-2 overflow-hidden px-2"
            aria-label={`${siteConfig.name} recruiter home`}
          >
            <LogoMark className="h-8 w-8 shrink-0" />
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {NAV.map(({ title, href, icon: Icon }) => {
                const active =
                  href === "/recruiter"
                    ? pathname === "/recruiter"
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={title}>
                      <Link
                        href={href}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon />
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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar ?? undefined} alt="" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-text-primary">
              {user?.name ?? "Recruiter"}
            </p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b border-border-default px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Briefcase className="h-4 w-4" />
            <span>Recruiter workspace</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Portfolio dashboard</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
