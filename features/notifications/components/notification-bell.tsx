"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/api/use-notifications";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { formatUnreadBadge } from "@/features/notifications/lib/time";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { data: count } = useUnreadNotificationCount();
  // Only fetch the list once the popover has been opened.
  const list = useNotifications(open);
  const markAll = useMarkAllNotificationsRead();
  const badge = formatUnreadBadge(count);
  const items = list.data?.pages.flatMap((page) => page.data).slice(0, 10) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("relative", className)}
          aria-label={badge ? `Notifications, ${badge} unread` : "Notifications"}
        >
          <Bell className="h-4 w-4" aria-hidden />
          {badge ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-semibold leading-4 text-white">
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold text-text-primary">Notifications</p>
          <Button
            variant="ghost"
            size="xs"
            disabled={!count || markAll.isPending}
            onClick={() => markAll.mutate(undefined, { onError: (error) => toast.error(error.message) })}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          <NotificationList
            items={items}
            isLoading={list.isLoading}
            isError={list.isError}
            onNavigate={() => setOpen(false)}
          />
        </div>
        <div className="border-t px-3 py-2 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-brand-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
