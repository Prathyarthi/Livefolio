"use client";

import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useDeleteNotification,
  useMarkNotificationRead,
  type NotificationItem,
} from "@/features/notifications/api/use-notifications";
import { formatRelativeTime } from "@/features/notifications/lib/time";

export function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate?: () => void;
}) {
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();
  const unread = !item.readAt;

  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        {unread ? <span className="size-2 shrink-0 rounded-full bg-brand-primary" aria-label="Unread" /> : null}
        <p className={cn("truncate text-sm", unread ? "font-semibold text-text-primary" : "text-text-secondary")}>
          {item.title}
        </p>
      </div>
      {item.body ? <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{item.body}</p> : null}
      <p className="mt-1 text-[11px] text-text-muted">{formatRelativeTime(item.createdAt)}</p>
    </div>
  );

  const handleOpen = () => {
    if (unread) markRead.mutate(item.id);
    onNavigate?.();
  };

  return (
    <li className="group flex items-start gap-2 rounded-md px-3 py-2.5 hover:bg-surface-raised">
      {item.href ? (
        <Link href={item.href} onClick={handleOpen} className="flex min-w-0 flex-1">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={handleOpen} className="flex min-w-0 flex-1 text-left">
          {content}
        </button>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 opacity-60 group-hover:opacity-100"
        aria-label="Delete notification"
        onClick={() =>
          remove.mutate(item.id, { onError: (error) => toast.error(error.message) })
        }
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </li>
  );
}

export function NotificationList({
  items,
  isLoading,
  isError,
  onNavigate,
  emptyText = "You're all caught up.",
}: {
  items: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  onNavigate?: () => void;
  emptyText?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" aria-hidden />
      </div>
    );
  }
  if (isError) {
    return <p className="px-3 py-8 text-center text-sm text-text-muted">Couldn&apos;t load notifications.</p>;
  }
  if (!items.length) {
    return <p className="px-3 py-8 text-center text-sm text-text-muted">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
