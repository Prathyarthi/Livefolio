"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import {
  usePortfolio,
  useUpdatePortfolio,
} from "@/features/portfolio/api/use-portfolio";
import { OpenToOpportunitiesCard } from "@/features/recruiter/components/open-to-opportunities-card";
import { CreatePortfolioPrompt, PORTFOLIO_ACTION_BUTTON_CLASS } from "@/features/portfolio/components/create-portfolio-prompt";
import type { PortfolioCustomization, TemplateSectionId } from "@/features/templates/types";
import { getSectionLabel, NAVBAR_SECTION_TO_KEY } from "@/features/templates/section-labels";

const defaultNavbarSettings: {
  enabled: boolean;
  sections: Record<TemplateSectionId, boolean>;
} = {
  enabled: true,
  sections: {
    about: true,
    work: true,
    experience: true,
    profiles: true,
  },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: portfolio } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const [navbarSettings, setNavbarSettings] = useState(defaultNavbarSettings);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const customization =
      portfolio?.customization &&
        typeof portfolio.customization === "object" &&
        !Array.isArray(portfolio.customization)
        ? (portfolio.customization as PortfolioCustomization)
        : {};

    const navbar = customization.navbar;

    setNavbarSettings({
      enabled: navbar?.enabled !== false,
      sections: {
        about: navbar?.sections?.about !== false,
        work: navbar?.sections?.work !== false,
        experience: navbar?.sections?.experience !== false,
        profiles: navbar?.sections?.profiles !== false,
      },
    });
  }, [portfolio?.customization]);

  const handleNavbarSave = () => {
    updatePortfolio.mutate(
      {
        customization: {
          navbar: {
            enabled: navbarSettings.enabled,
            sections: navbarSettings.sections,
          },
        },
      },
      {
        onSuccess: () => toast.success("Navbar preferences updated"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete account");
      }

      toast.success("Your account has been deleted");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
      setDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-6">
      <div>
        <h1 className="text-h2 text-text-primary">Settings</h1>
        <p className="mt-1 text-body-sm text-text-secondary">Manage your account and portfolio settings.</p>
      </div>

      {!portfolio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h3 text-text-primary">Create your portfolio first</CardTitle>
            <CardDescription className="text-body-sm text-text-secondary">
              Settings are available after a portfolio has been created.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CreatePortfolioPrompt />
            <Button variant="outline" className={PORTFOLIO_ACTION_BUTTON_CLASS} asChild>
              <Link href="/dashboard">Go to Overview</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={session?.user?.name ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={session?.user?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      {portfolio ? (
        <OpenToOpportunitiesCard
          openToOpportunities={Boolean(portfolio.openToOpportunities)}
        />
      ) : null}

      {portfolio ? (
        <Card>
        <CardHeader>
          <CardTitle>Portfolio Navbar</CardTitle>
          <CardDescription>
            Control whether the public portfolio shows section navigation and
            which anchors are available, with up to 4 visible nav items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-4 py-3">
            <div className="space-y-1">
              <Label htmlFor="navbar-enabled">Show navbar</Label>
              <p className="text-body-sm text-text-secondary">
                When enabled, visitors can jump to visible sections on the page.
              </p>
            </div>
            <Switch
              id="navbar-enabled"
              checked={navbarSettings.enabled}
              onCheckedChange={(checked) =>
                setNavbarSettings((current) => ({ ...current, enabled: checked }))
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Sections</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "about",
                  "work",
                  "experience",
                  "profiles",
                ] as const satisfies readonly TemplateSectionId[]
              ).map((key) => {
                const active = navbarSettings.sections[key];
                const label = getSectionLabel(
                  NAVBAR_SECTION_TO_KEY[key],
                  portfolio?.customization as PortfolioCustomization | undefined
                );

                return (
                  <Button
                    key={key}
                    type="button"
                    variant={active ? "default" : "outline"}
                    disabled={!navbarSettings.enabled}
                    onClick={() =>
                      setNavbarSettings((current) => ({
                        ...current,
                        sections: {
                          ...current.sections,
                          [key]: !current.sections[key],
                        },
                      }))
                    }
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Sections still only appear when the portfolio actually has data for
              them.
            </p>
          </div>

          <Button onClick={handleNavbarSave} disabled={updatePortfolio.isPending}>
            {updatePortfolio.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Navbar Preferences"
            )}
          </Button>
        </CardContent>
      </Card>
      ) : null}

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-body-sm text-text-secondary">
            This removes your portfolio, imports, analytics, and subscription.
            This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting account...
              </>
            ) : (
              "Delete account"
            )}
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => void handleDeleteAccount()}
        deleting={deletingAccount}
      />

      <FlowFooter
        previous={{ href: "/dashboard/preview", label: "Previous: Preview" }}
        next={{ href: "/dashboard", label: "Finish: Overview" }}
      />
    </div>
  );
}
