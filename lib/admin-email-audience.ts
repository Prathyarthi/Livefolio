import {
  getAutomatedEmailDemos,
  type AutomatedEmailDemo,
} from "@/lib/email-templates";

export type AdminEmailAudienceId =
  | "all"
  | "no_portfolio"
  | "draft"
  | "published";

/** Event-triggered emails (references) have no audience segment and fall back to `all`. */
const AUDIENCE_BY_DEMO_ID: Partial<
  Record<AutomatedEmailDemo["id"], AdminEmailAudienceId>
> = {
  welcome: "all",
  no_portfolio: "no_portfolio",
  unpublished: "draft",
  published: "published",
};

const AUDIENCE_BY_TEMPLATE_NAME = new Map(
  getAutomatedEmailDemos().flatMap((demo) => {
    const audience = AUDIENCE_BY_DEMO_ID[demo.id];
    return audience ? [[demo.label.toLowerCase(), audience] as const] : [];
  }),
);

export function audienceForTemplateName(
  name: string | null | undefined,
): AdminEmailAudienceId {
  if (!name?.trim()) return "all";
  return AUDIENCE_BY_TEMPLATE_NAME.get(name.trim().toLowerCase()) ?? "all";
}

/** Prisma `UserWhereInput` fragment for a template audience. `all` matches everyone. */
export function adminEmailAudienceWhere(category: string) {
  switch (category) {
    case "no_portfolio":
      return { portfolio: { is: null } };
    case "draft":
      return { portfolio: { is: { isPublished: false } } };
    case "published":
      return { portfolio: { is: { isPublished: true } } };
    default:
      return undefined;
  }
}