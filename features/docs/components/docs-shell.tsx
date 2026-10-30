import { ScrollArea } from "@/components/ui/scroll-area";
import { DocsHeader } from "@/features/docs/components/docs-header";
import { DocsSidebarNav } from "@/features/docs/components/docs-sidebar-nav";

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      <DocsHeader />
      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 sm:px-6">
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-64 shrink-0 border-r border-border-default lg:block">
          <ScrollArea className="h-full py-8 pr-4">
            <DocsSidebarNav />
          </ScrollArea>
        </aside>
        <main className="min-w-0 flex-1 py-8 md:py-12">{children}</main>
      </div>
    </div>
  );
}
