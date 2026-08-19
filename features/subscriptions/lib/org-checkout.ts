import {
  BILLING_INTERVAL_LABELS,
  formatOrgProPriceLabel,
  type BillingInterval,
} from "@/lib/pricing";
import { siteConfig } from "@/lib/site";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export async function startOrgProCheckout(options: {
  orgSlug: string;
  interval: BillingInterval;
  razorpayLoaded: boolean;
  onError: (message: string) => void;
  onDismiss?: () => void | Promise<void>;
}): Promise<void> {
  const { orgSlug, interval, razorpayLoaded, onError, onDismiss } = options;

  if (!razorpayLoaded || !window.Razorpay) {
    onError("Payment system is loading. Please try again.");
    return;
  }

  const res = await fetch("/api/org-billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgSlug, interval }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    keyId?: string;
    subscriptionId?: string;
    email?: string;
  };

  if (!res.ok) {
    onError(
      typeof body.error === "string"
        ? body.error
        : "Checkout could not be started.",
    );
    return;
  }

  const returnUrl = `${window.location.origin}/company/${orgSlug}/billing?return=true`;

  const razorpay = new window.Razorpay({
    key: body.keyId,
    subscription_id: body.subscriptionId,
    name: `${siteConfig.name} Org Pro`,
    description: `Org Pro — ${formatOrgProPriceLabel(interval)}`,
    prefill: {
      email: body.email || "",
    },
    theme: {
      color: "#14b8a6",
    },
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const confirmRes = await fetch("/api/org-billing/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgSlug,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        if (!confirmRes.ok) {
          const confirmBody = (await confirmRes.json().catch(() => ({}))) as {
            error?: string;
          };
          onError(
            typeof confirmBody.error === "string"
              ? confirmBody.error
              : "Payment succeeded but activation failed. Refresh billing in a moment.",
          );
        }
      } catch {
        onError(
          "Payment succeeded but activation failed. Refresh billing in a moment.",
        );
      } finally {
        window.location.assign(returnUrl);
      }
    },
    modal: {
      ondismiss: () => {
        void (async () => {
          try {
            await fetch("/api/org-billing/checkout/dismiss", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orgSlug,
                subscriptionId: body.subscriptionId,
              }),
            });
          } finally {
            await onDismiss?.();
          }
        })();
      },
    },
  });

  razorpay.open();
}

export function orgSubscribeButtonLabel(
  interval: BillingInterval,
  subscribing: boolean,
  pending = false,
): string {
  if (subscribing) return "Opening checkout…";
  if (pending) return "Payment pending…";
  return `Subscribe — ${BILLING_INTERVAL_LABELS[interval]}`;
}
