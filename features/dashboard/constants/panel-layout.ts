/**
 * Full-height dashboard panel shell (edit, import).
 * Subtracts the sticky header (4rem) and main padding (3rem).
 */
export const DASHBOARD_PANEL_PAGE_CLASS =
  "flex min-h-0 flex-1 flex-col lg:h-[calc(100svh-4rem-3rem)] lg:max-h-[calc(100svh-4rem-3rem)] lg:overflow-hidden";

/** Left tracker / edit rail — edit & import progress stepper. */
export const DASHBOARD_TRACKER_ASIDE_CLASS =
  "hidden h-full min-h-0 shrink-0 flex-col self-stretch overflow-y-auto overscroll-contain lg:flex lg:w-[15rem] lg:pl-4 lg:pr-3 xl:w-[16rem] xl:pl-4 xl:pr-3 2xl:w-[17rem]";

/** Preview page inspect & edit sidebar — wider for forms and template picker. */
export const PREVIEW_EDIT_SIDEBAR_CLASS =
  "hidden h-full min-h-0 shrink-0 flex-col overflow-hidden lg:flex lg:w-[26rem] lg:pl-4 lg:pr-4 xl:w-[30rem] xl:pl-5 xl:pr-4 2xl:w-[32rem]";

/** Tighter card padding inside dashboard edit/import forms. */
export const DASHBOARD_FORM_COMPACT_CLASS =
  "[&_[data-slot=card]]:gap-4 [&_[data-slot=card]]:py-4 [&_[data-slot=card-header]]:px-4 [&_[data-slot=card-content]]:px-4";

/** Right main column — fills remaining width like the preview canvas area. */
export const DASHBOARD_MAIN_COLUMN_CLASS =
  "flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 lg:overflow-hidden";

/** Preview-matched content frame (sunken border wrapper). */
export const DASHBOARD_CONTENT_FRAME_CLASS =
  "flex min-h-0 flex-1 flex-col rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken p-2 shadow-[var(--shadow-modal)] sm:p-3 lg:overflow-hidden";

export const DASHBOARD_CONTENT_INNER_CLASS =
  "min-h-0 w-full flex-1 rounded-[var(--radius-md)] bg-surface-base p-4 pb-6 sm:p-5 sm:pb-8 lg:overflow-y-auto lg:overscroll-contain " +
  DASHBOARD_FORM_COMPACT_CLASS;

/** Import page — natural page scroll instead of a fixed inner scroll region. */
export const DASHBOARD_IMPORT_PAGE_CLASS = "flex flex-1 flex-col";

export const DASHBOARD_IMPORT_TRACKER_ASIDE_CLASS =
  "hidden shrink-0 flex-col lg:flex lg:w-[15rem] lg:pl-4 lg:pr-3 xl:w-[16rem] xl:pl-4 xl:pr-3 2xl:w-[17rem]";

export const DASHBOARD_IMPORT_MAIN_COLUMN_CLASS =
  "flex min-w-0 w-full flex-1 flex-col gap-2";

export const DASHBOARD_IMPORT_CONTENT_FRAME_CLASS =
  "flex flex-col rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken p-2 shadow-[var(--shadow-modal)] sm:p-3";

export const DASHBOARD_IMPORT_CONTENT_INNER_CLASS =
  "w-full rounded-[var(--radius-md)] bg-surface-base p-4 pb-6 sm:p-5 sm:pb-8 " +
  DASHBOARD_FORM_COMPACT_CLASS;
