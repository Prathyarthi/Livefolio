"use client";

import { DevtoIcon } from "@/components/icons";
import { useFetchDevto, useImportDevto } from "@/features/profile/api/use-devto";
import { ArticleSourceImporter } from "@/features/profile/components/article-source-importer";

export function DevtoImporter() {
  const fetchDevto = useFetchDevto();
  const importDevto = useImportDevto();

  return (
    <ArticleSourceImporter
      platformLabel="Dev.to"
      icon={DevtoIcon}
      placeholder="e.g. ben"
      description="Enter your Dev.to username to fetch articles and add them to your portfolio."
      usernameFieldId="devto-username"
      isFetching={fetchDevto.isPending}
      isImporting={importDevto.isPending}
      fetchProfile={(username) => fetchDevto.mutateAsync(username)}
      importSelected={(input) => importDevto.mutateAsync(input)}
    />
  );
}