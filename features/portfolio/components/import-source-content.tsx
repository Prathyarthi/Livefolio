"use client";

import { ResumeUploader } from "@/features/resume/components/resume-uploader";
import { GitHubImporter } from "@/features/profile/components/github-importer";
import { LeetCodeImporter } from "@/features/profile/components/leetcode-importer";
import { MediumImporter } from "@/features/profile/components/medium-importer";
import { DevtoImporter } from "@/features/profile/components/devto-importer";
import { HashnodeImporter } from "@/features/profile/components/hashnode-importer";
import { StackOverflowImporter } from "@/features/profile/components/stackoverflow-importer";
import { CodeforcesImporter } from "@/features/profile/components/codeforces-importer";
import type { ReactNode } from "react";
import {
  IMPORT_SOURCES,
  type ImportSourceValue,
} from "@/features/portfolio/constants/import-sources";

type ImportSourceContentProps = {
  source: ImportSourceValue;
  canUseImports: boolean;
  onToolbarActionsChange?: (actions: ReactNode) => void;
};

export function ImportSourceContent({
  source,
  canUseImports,
  onToolbarActionsChange,
}: ImportSourceContentProps) {
  if (!canUseImports) {
    const label =
      IMPORT_SOURCES.find((item) => item.value === source)?.label ?? "This";
    return (
      <p className="text-body-sm text-text-secondary">
        {label} import is locked. Upgrade to Pro to use it.
      </p>
    );
  }

  return (
    <>
      <div hidden={source !== "resume"}>
        <ResumeUploader onToolbarActionsChange={onToolbarActionsChange} />
      </div>
      <div hidden={source !== "github"}>
        <GitHubImporter />
      </div>
      <div hidden={source !== "medium"}>
        <MediumImporter />
      </div>
      <div hidden={source !== "leetcode"}>
        <LeetCodeImporter />
      </div>
      <div hidden={source !== "devto"}>
        <DevtoImporter />
      </div>
      <div hidden={source !== "hashnode"}>
        <HashnodeImporter />
      </div>
      <div hidden={source !== "stackoverflow"}>
        <StackOverflowImporter />
      </div>
      <div hidden={source !== "codeforces"}>
        <CodeforcesImporter />
      </div>
    </>
  );
}