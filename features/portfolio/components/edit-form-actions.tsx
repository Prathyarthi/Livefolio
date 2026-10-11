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
        "sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border-default bg-surface-base/95 px-4 py-3 backdrop-blur-sm sm:-mx-5 sm:px-5",
        className
      )}
    >
      {children}
    </div>
  );
}
