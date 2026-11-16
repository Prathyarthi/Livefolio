"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type PublishedFilter = "all" | "true" | "false";

const FILTERS: Array<{ value: PublishedFilter; label: string; hint: string }> =
  [
    {
      value: "true",
      label: "Published",
      hint: "Live portfolios only (isPublished: true)",
    },
    {
      value: "false",
      label: "Draft",
      hint: "Unpublished portfolios only (isPublished: false)",
    },
    {
      value: "all",
      label: "Both",
      hint: "Every portfolio, published and draft",
    },
  ];

export default function AdminExportPage() {
  const [filter, setFilter] = useState<PublishedFilter>("all");
  const [downloading, setDownloading] = useState(false);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ isPublished: filter });
      const res = await fetch(`/api/admin/portfolio-data?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "livefolio-portfolios.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 text-text-primary">Export portfolios</h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Download every section for matching portfolios as a CSV. Nested
          sections are stored as JSON in each cell.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published filter</CardTitle>
          <CardDescription>
            Choose published, draft, or both, then download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset className="space-y-3">
            <legend className="sr-only">Portfolio publish state</legend>
            {FILTERS.map((option) => (
              <Label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken/40 px-4 py-3"
              >
                <input
                  type="radio"
                  name="isPublished"
                  className="mt-1"
                  checked={filter === option.value}
                  onChange={() => setFilter(option.value)}
                />
                <span>
                  <span className="block text-sm font-medium text-text-primary">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {option.hint}
                  </span>
                </span>
              </Label>
            ))}
          </fieldset>

          <Button
            type="button"
            onClick={() => void downloadCsv()}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Preparing CSV" : "Download CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
