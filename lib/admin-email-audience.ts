import { getAutomatedEmailDemos } from "@/lib/email-templates";

export type AdminEmailAudienceId =
  | "all"
  | "no_portfolio"
  | "draft"
  | "published";

const AUDIENCE_BY_DEMO_ID = {
  welcome: "all",
  no_portfolio: "no_portfolio",
  unpublished: "draft",
  published: "published",
} as const satisfies Record<string, AdminEmailAudienceId>;

const AUDIENCE_BY_TEMPLATE_NAME = new Map(
  getAutomatedEmailDemos().map((demo) => [
    demo.label.toLowerCase(),
    AUDIENCE_BY_DEMO_ID[demo.id],
  ]),
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
