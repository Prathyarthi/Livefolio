import { DocsShell } from "@/features/docs/components/docs-shell";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsShell>{children}</DocsShell>;
}
