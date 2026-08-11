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

function CompanySidebar({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: org } = useOrganization(orgSlug);
  const user = session?.user;
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const canManageBilling = Boolean(org?.permissions.manageOrganization);

  const nav = [
    {
      title: "Overview",
      href: `/company/${orgSlug}`,
      icon: LayoutDashboard,
    },
    {
      title: "Jobs",
      href: `/company/${orgSlug}/jobs`,
      icon: Briefcase,
    },
    {
      title: "Settings",
      href: `/company/${orgSlug}/settings`,
      icon: Settings,
    },
    ...(canManageBilling
      ? [
          {
            title: "Billing",
            href: `/company/${orgSlug}/billing`,
            icon: CreditCard,
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
          <div className="flex min-w-0 flex-col gap-1 px-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
            <Link
              href={`/company/${orgSlug}`}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className="flex min-w-0 items-center gap-2 overflow-hidden"
            >
              <LogoMark className="h-8 w-8 shrink-0" />
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block truncate font-display text-sm font-bold text-brand-primary">
                  {org?.name ?? "Company"}
                </span>
                <span className="block text-[11px] text-text-muted">
                  Hiring workspace
                </span>
              </span>
            </Link>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:p-1.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-1">
              {nav.map(({ title, href, icon: Icon }) => {
                const active =
                  href === `/company/${orgSlug}`
                    ? pathname === href
                    : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={title}
                    >
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

      <SidebarFooter className="border-t border-sidebar-border gap-2 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="New job">
              <Link href={`/company/${orgSlug}/jobs/new`}>
                <Plus />
                <span>New job</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Your Livefolio">
              <Link href="/dashboard">
                <ArrowLeft />
                <span>Your Livefolio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-text-primary">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
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
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;

  useEffect(() => {
    document.body.dataset.hiring = "company";
    return () => {
      delete document.body.dataset.hiring;
    };
  }, []);

  if (!orgSlug) return null;

  return (
    <SidebarProvider>
      <CompanySidebar orgSlug={orgSlug} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border-default px-4 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-medium text-text-primary">
            Hiring workspace
          </span>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
