"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
  User,
  PanelLeft,
  ArrowLeft,
  Plus,
  CreditCard,
  Users,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo";
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
import { useOrganization } from "@/features/organization/api/use-organization";
import { OrgLogo } from "@/features/organization/components/org-logo";
function CompanySidebar({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug?: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: org } = useOrganization(orgSlug);
  const user = session?.user;
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const canManageBilling = Boolean(org?.permissions.manageOrganization);
  const activeWorkspaceSlug =
    workspaceSlug ?? org?.workspaces?.[0]?.slug ?? null;
  const workspaceBase = activeWorkspaceSlug
    ? `/company/${orgSlug}/${activeWorkspaceSlug}`
    : `/company/${orgSlug}`;

  const nav = [
    {
      title: "Workspaces",
      href: `/company/${orgSlug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    ...(activeWorkspaceSlug
      ? [
          {
            title: "Jobs",
            href: `${workspaceBase}/jobs`,
            icon: Briefcase,
            exact: false,
          },
          {
            title: "Talent",
            href: `${workspaceBase}/talent`,
            icon: Users,
            exact: false,
          },
          {
            title: "Workspace Settings",
            href: `${workspaceBase}/settings`,
            icon: Settings,
            exact: false,
          },
        ]
      : []),
    {
      title: "Org Settings",
      href: `/company/${orgSlug}/settings`,
      icon: Settings,
      exact: false,
    },
    ...(canManageBilling
      ? [
          {
            title: "Billing",
            href: `/company/${orgSlug}/billing`,
            icon: CreditCard,
            exact: false,
          },
        ]
      : []),
  ];

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
          <div className="flex min-w-0 items-center gap-1 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              href={`/company/${orgSlug}`}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
            >
              {org?.logoUrl ? (
                <OrgLogo
                  name={org.name}
                  logoUrl={org.logoUrl}
                  brandColor={org.brandColor}
                  size="sm"
                  className="ring-0"
                />
              ) : (
                <LogoMark className="h-8 w-8 shrink-0" />
              )}
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="flex min-w-0 items-center gap-1 font-display text-sm font-bold text-brand-primary">
                  <span className="truncate">{org?.name ?? "Company"}</span>
                  {org?.verified ? (
                    <BadgeCheck className="size-3.5 shrink-0 text-sky-500" aria-label="Verified company" />
                  ) : null}
                </span>
                <span className="block text-[11px] text-text-muted">
                  {org?.verified ? "Verified company" : org?.name ? "Organization" : "Hiring"}
                </span>
              </span>
            </Link>
            {!isMobile ? (
              <SidebarTrigger className="size-8 shrink-0" />
            ) : null}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:p-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-1">
              {nav.map(({ title, href, icon: Icon, exact }) => {
                const active = exact
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

      <SidebarFooter className="border-t border-sidebar-border gap-2 group-data-[collapsible=icon]:p-1">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {activeWorkspaceSlug ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip="New job"
                className="gap-3 text-base [&_svg]:size-5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&_span]:hidden group-data-[collapsible=icon]:[&_svg]:size-5"
              >
                <Link
                  href={`${workspaceBase}/jobs/new`}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <Plus aria-hidden />
                  <span>New job</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Your Livefolio"
              className="gap-3 text-base [&_svg]:size-5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&_span]:hidden group-data-[collapsible=icon]:[&_svg]:size-5"
            >
              <Link
                href="/dashboard"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <ArrowLeft aria-hidden />
                <span>Your Livefolio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
              {user?.name ?? "User"}
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
              <LogOut
                className="h-4 w-4 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5"
                aria-hidden
              />
            </Button>
          </div>
        </div>
        <p className="px-1 text-[10px] text-text-muted group-data-[collapsible=icon]:hidden">
          Powered by {siteConfig.name}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ orgSlug: string; workspaceSlug?: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug =
    params.workspaceSlug &&
    params.workspaceSlug !== "settings" &&
    params.workspaceSlug !== "billing"
      ? params.workspaceSlug
      : undefined;

  useEffect(() => {
    document.body.dataset.hiring = "company";
    return () => {
      delete document.body.dataset.hiring;
    };
  }, []);

  if (!orgSlug) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <CompanySidebar orgSlug={orgSlug} workspaceSlug={workspaceSlug} />
      <SidebarInset className="relative min-w-0 overflow-x-hidden bg-surface-base">
        <CompanyHeader />
        <main className="relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function CompanyHeader() {
  return (
    <header className="glass-nav sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-4 md:hidden">
      <SidebarTrigger className="size-9" />
      <span className="text-sm font-medium text-text-primary">Hiring</span>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle className="size-9" />
      </div>
    </header>
  );
}
