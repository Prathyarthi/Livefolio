# Docs screenshots

Screenshots live in `public/docs/<name>.png` and are registered in
`features/docs/content/screenshots.ts`. Entries with `available: false`
render a dashed "Screenshot coming soon" placeholder.

Capture at 1440×900 (desktop, light theme), crop to the relevant area,
save as PNG with the exact file name below, then set `available: true`.

## Captured (public pages)

- landing.png — `/`
- sign-up.png — `/sign-up`
- sign-in.png — `/sign-in`
- pricing.png — `/pricing`
- contact.png — `/contact`

## Captured (signed-in dashboard)

dashboard-overview, import-resume (shows the locked-imports state of the
capturing account), edit-basic-info, edit-experience, edit-projects,
edit-custom-sections, edit-social, edit-publish-step, share-dialog, templates,
preview, preview-sections, references, analytics, billing, settings.

## Still needed

| File | Page / state | Why it was skipped |
| --- | --- | --- |
| dashboard-create-portfolio.png | `/dashboard` for an account with no portfolio | Capturing account already has a portfolio |
| import-integrations.png | `/dashboard/import`, GitHub selected | Imports are locked on the capturing account, so sources cannot be selected |
| publish-dialog.png | `/dashboard/preview` → Publish dialog | Capturing account is already published; the toolbar button would unpublish |
