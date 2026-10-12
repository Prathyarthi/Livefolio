"use client";

import { HashnodeIcon } from "@/components/icons";
import { useFetchHashnode, useImportHashnode } from "@/features/profile/api/use-hashnode";
import { ArticleSourceImporter } from "@/features/profile/components/article-source-importer";

export function HashnodeImporter() {
  const fetchHashnode = useFetchHashnode();
  const importHashnode = useImportHashnode();

  return (
    <ArticleSourceImporter
      platformLabel="Hashnode"
      icon={HashnodeIcon}
      placeholder="username or https://yourblog.com"
      description="Enter your Hashnode username, or the blog URL if you use a custom domain."
      usernameFieldId="hashnode-username"
      isFetching={fetchHashnode.isPending}
      isImporting={importHashnode.isPending}
      fetchProfile={(username) => fetchHashnode.mutateAsync(username)}
      importSelected={(input) => importHashnode.mutateAsync(input)}
    />
  );
}
