"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/features/notifications/api/use-notifications";

/** In-app toggles only for now; email shows once the channel ships. */
export function NotificationPreferences() {
  const { data, isLoading, isError } = useNotificationPreferences();
  const update = useUpdateNotificationPreference();

  if (isLoading) return <p className="text-sm text-text-muted">Loading preferences…</p>;
  if (isError || !data) return <p className="text-sm text-text-muted">Couldn&apos;t load preferences.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {data.map((row) => {
        const id = `notif-pref-${row.type}`;
        return (
          <li key={row.type} className="flex items-center justify-between gap-4">
            <Label htmlFor={id} className="text-sm text-text-primary">
              {row.label}
            </Label>
            <Switch
              id={id}
              checked={row.channels.in_app}
              onCheckedChange={(enabled) =>
                update.mutate(
                  { type: row.type, channel: "in_app", enabled },
                  { onError: (error) => toast.error(error.message) },
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
