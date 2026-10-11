"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import {
  DASHBOARD_IMPORT_CONTENT_FRAME_CLASS,
  DASHBOARD_IMPORT_CONTENT_INNER_CLASS,
  DASHBOARD_IMPORT_MAIN_COLUMN_CLASS,
  DASHBOARD_IMPORT_PAGE_CLASS,
  DASHBOARD_IMPORT_TRACKER_ASIDE_CLASS,
} from "@/features/dashboard/constants/panel-layout";
import { usePortfolio } from "@/features/portfolio/api/use-portfolio";
import { ImportSourceContent } from "@/features/portfolio/components/import-source-content";
import {
  ImportSourcePicker,
  ImportSourceSelector,
} from "@/features/portfolio/components/import-source-selector";
import {
  IMPORT_SOURCES,
  type ImportSourceValue,
} from "@/features/portfolio/constants/import-sources";

export default function ImportPage() {
  const router = useRouter();
  const { data: portfolio } = usePortfolio();
  const [canUseImports, setCanUseImports] = useState(true);
  const [activeSource, setActiveSource] = useState<ImportSourceValue>("resume");
  const [toolbarActions, setToolbarActions] = useState<ReactNode>(null);

  const currentSource = useMemo(
    () => IMPORT_SOURCES.find((source) => source.value === activeSource)!,
    [activeSource]
  );

  useEffect(() => {
    let cancelled = false;
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/billing/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as {
          access?: { canUseImports?: boolean };
        };
        if (cancelled) return;
        setCanUseImports(data.access?.canUseImports ?? true);
      } catch {
        if (cancelled) return;
        setCanUseImports(true);
      }
    };
    loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={DASHBOARD_IMPORT_PAGE_CLASS}>
      <div className="shrink-0 space-y-6">
        <div>
          <h1 className="text-h2 text-text-primary">Import data</h1>
          <p className="mt-1 max-w-2xl text-body-sm text-text-secondary">
          Choose a platform on the left, then import into your portfolio one
          source at a time.
          </p>
        </div>

        {!canUseImports && (
          <div className="max-w-3xl rounded-[var(--radius-lg)] border border-border-default bg-warning-bg p-4 text-body-sm">
            <p className="font-medium text-text-primary">
              Imports are available during your free month and with Pro.
            </p>
            <p className="mt-2 text-text-secondary">
              After the trial, you can still edit and publish on the Minimal
              template — upgrade to import from resume, GitHub, Medium, or LeetCode
              again.
            </p>
            <Button asChild className="mt-4" variant="secondary">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        )}
      </div>

      <Separator className="mt-6" />

      <div className="shrink-0 py-4">
        <FlowFooter
          className="border-0 p-0"
          message={null}
          previous={{
            href: "/dashboard/templates",
            label: "Previous: Templates",
          }}
          next={{
            label: "Next: Preview",
            onClick: () => router.push("/dashboard/preview"),
          }}
        />
      </div>

      <div className="flex w-full flex-1 flex-col lg:flex-row lg:gap-0">
        <aside className={DASHBOARD_IMPORT_TRACKER_ASIDE_CLASS}>
          <ImportSourceSelector
            activeSource={activeSource}
            onSourceChange={setActiveSource}
            portfolio={portfolio}
            disabled={!canUseImports}
          />
        </aside>

        <div className={DASHBOARD_IMPORT_MAIN_COLUMN_CLASS}>
          <ImportSourcePicker
            activeSource={activeSource}
            onSourceChange={setActiveSource}
            disabled={!canUseImports}
          />

          <div className="shrink-0">
            <p className="eyebrow hidden lg:block">Selected source</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h3 text-text-primary">
                {currentSource.label}
              </h2>
              {activeSource === "resume" ? toolbarActions : null}
            </div>
            <p className="mt-1 text-body-sm text-text-secondary">
              {currentSource.description}
            </p>
          </div>

          <div className={DASHBOARD_IMPORT_CONTENT_FRAME_CLASS}>
            <div className={DASHBOARD_IMPORT_CONTENT_INNER_CLASS}>
              <ImportSourceContent
                source={activeSource}
                canUseImports={canUseImports}
                onToolbarActionsChange={
                  activeSource === "resume" ? setToolbarActions : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
