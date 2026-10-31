"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/features/notifications/api/use-notifications";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";

export default function NotificationsPage() {
  const list = useNotifications();
  const { data: unread } = useUnreadNotificationCount();
  const markAll = useMarkAllNotificationsRead();
  const items = list.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-muted">
            {unread ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!unread || markAll.isPending}
          onClick={() => markAll.mutate(undefined, { onError: (error) => toast.error(error.message) })}
        >
          Mark all read
        </Button>
      </div>

      <Card>
        <CardContent className="p-2">
          <NotificationList items={items} isLoading={list.isLoading} isError={list.isError} />
          {list.hasNextPage ? (
            <div className="flex justify-center p-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={list.isFetchingNextPage}
                onClick={() => void list.fetchNextPage()}
              >
                {list.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Choose which notifications appear in your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences />
        </CardContent>
      </Card>
    </div>
  );
}
