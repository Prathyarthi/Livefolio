import { cn } from "@/lib/utils";

export function EditFormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 -mx-4 mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border-default bg-surface-base px-4 py-3 sm:-mx-5 sm:px-5",
        className
      )}
    >
      {children}
    </div>
  );
}
