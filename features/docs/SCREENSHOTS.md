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

## Still needed (require a signed-in account with a portfolio)

| File | Page / state |
| --- | --- |
| dashboard-overview.png | `/dashboard` with a portfolio |
| dashboard-create-portfolio.png | `/dashboard` for a new account (Create portfolio button) |
| import-resume.png | `/dashboard/import`, Resume selected |
| import-integrations.png | `/dashboard/import`, GitHub selected |
| edit-basic-info.png | `/dashboard/edit?step=basic` |
| edit-experience.png | `/dashboard/edit?step=experience` |
| edit-projects.png | `/dashboard/edit?step=projects` |
| edit-custom-sections.png | `/dashboard/edit?step=custom` |
| edit-social.png | `/dashboard/edit?step=social` |
| edit-publish-step.png | `/dashboard/edit?step=publish` |
| templates.png | `/dashboard/templates` |
| preview.png | `/dashboard/preview` |
| preview-sections.png | `/dashboard/preview` with editor panel on the Sections tab |
| publish-dialog.png | `/dashboard/preview` → Publish dialog open |
| share-dialog.png | Share dialog open |
| references.png | `/dashboard/references` |
| analytics.png | `/dashboard/analytics` |
| billing.png | `/dashboard/billing` |
| settings.png | `/dashboard/settings` |
