import type {
  ReorderableSectionKey,
  TemplateSectionLayout,
} from "./section-order";

function singleColumn(
  order: ReorderableSectionKey[],
): TemplateSectionLayout {
  return {
    groups: [
      {
        id: "full",
        label: "Sections",
        defaultOrder: order,
      },
    ],
  };
}

/** Former two-column templates: one flat order (main → aside → github). */
const FORMER_TWO_COLUMN: ReorderableSectionKey[] = [
  "about",
  "projects",
  "experience",
  "articles",
  "skills",
  "education",
  "certifications",
  "achievements",
  "profiles",
  "github",
];

const STANDARD_SINGLE: ReorderableSectionKey[] = [
  "about",
  "projects",
  "experience",
  "skills",
  "education",
  "certifications",
  "achievements",
  "articles",
  "profiles",
  "github",
];

const AIRY_FAMILY: ReorderableSectionKey[] = [
  "about",
  "projects",
  "experience",
  "skills",
  "education",
  "certifications",
  "achievements",
  "articles",
  "github",
];

export const TEMPLATE_SECTION_LAYOUTS: Record<string, TemplateSectionLayout> = {
  modern: singleColumn(FORMER_TWO_COLUMN),
  minimal: singleColumn(FORMER_TWO_COLUMN),
  creative: singleColumn(FORMER_TWO_COLUMN),
  corporate: singleColumn(FORMER_TWO_COLUMN),
  retro: singleColumn(FORMER_TWO_COLUMN),

  vibrant: singleColumn(STANDARD_SINGLE),
  cyberpunk: singleColumn(STANDARD_SINGLE),
  pastel: singleColumn(STANDARD_SINGLE),
  monochrome: singleColumn(STANDARD_SINGLE),
  synthwave: singleColumn(STANDARD_SINGLE),
  artdeco: singleColumn(STANDARD_SINGLE),
  blueprint: singleColumn(STANDARD_SINGLE),
  windows: singleColumn(STANDARD_SINGLE),

  space: singleColumn([
    "about",
    "projects",
    "experience",
    "skills",
    "education",
    "certifications",
    "achievements",
    "articles",
    "github",
    "profiles",
  ]),

  paper: singleColumn([
    "about",
    "projects",
    "experience",
    "education",
    "skills",
    "certifications",
    "achievements",
    "articles",
    "github",
    "profiles",
  ]),

  airy: singleColumn(AIRY_FAMILY),
  terracotta: singleColumn(AIRY_FAMILY),
  citrus: singleColumn(AIRY_FAMILY),
  parchment: singleColumn(AIRY_FAMILY),

  developer: singleColumn([
    "about",
    "github",
    "experience",
    "skills",
    "projects",
    "profiles",
    "education",
    "certifications",
    "achievements",
  ]),

  spotlight: singleColumn([
    "about",
    "projects",
    "experience",
    "education",
    "skills",
    "articles",
    "achievements",
    "profiles",
    "github",
  ]),

  bento: {
    fixed: true,
    groups: [
      {
        id: "full",
        label: "Sections",
        defaultOrder: [
          "about",
          "profiles",
          "projects",
          "experience",
          "skills",
          "education",
          "articles",
          "github",
          "certifications",
          "achievements",
        ],
      },
    ],
  },
};

const FALLBACK_LAYOUT = singleColumn(STANDARD_SINGLE);

export function getTemplateSectionLayout(
  templateId: string,
): TemplateSectionLayout {
  return TEMPLATE_SECTION_LAYOUTS[templateId] ?? FALLBACK_LAYOUT;
}
