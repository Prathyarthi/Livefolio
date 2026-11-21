import { z } from "zod";
import { DATE_RE, SLUG_RE } from "@/features/blog/lib/posts";

const EM_DASH = "\u2014";

const text = (field: string, max: number) =>
  z
    .string({ error: `${field} must be a string` })
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} must be at most ${max} characters`)
    .refine((value) => !value.includes(EM_DASH), `${field} must not contain em dashes`);

const slug = z
  .string({ error: "slug must be a string" })
  .trim()
  .max(120, "slug must be at most 120 characters")
  .regex(SLUG_RE, "slug must be lowercase letters, numbers and hyphens");

const date = z
  .string({ error: "date must be a string" })
  .regex(DATE_RE, "date must be YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "date must be a real calendar date");

const cover = z
  .string({ error: "cover must be a string" })
  .trim()
  .max(2000, "cover must be at most 2000 characters")
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "cover must be an absolute https URL")
  .nullable();

const tags = z
  .array(text("tag", 40), { error: "tags must be an array of strings" })
  .max(20, "at most 20 tags");

const status = z.enum(["draft", "published"], { error: "status must be draft or published" });

const fields = {
  title: text("title", 200),
  date,
  description: text("description", 300),
  keyword: text("keyword", 120),
  cover: cover.optional(),
  author: text("author", 120).optional(),
  tags: tags.optional(),
  body: text("body", 200_000),
  status: status.optional(),
};

export const createBlogPostSchema = z.strictObject({ slug, ...fields });

/** Same fields, all optional. The slug is the post's identity and cannot change. */
export const updateBlogPostSchema = z.strictObject(
  Object.fromEntries(
    Object.entries(fields).map(([key, schema]) => [key, schema.optional()]),
  ) as { [K in keyof typeof fields]: z.ZodOptional<(typeof fields)[K]> },
);

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

export function formatIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message:
      issue.code === "unrecognized_keys"
        ? `Unknown field(s): ${issue.keys.join(", ")}`
        : issue.message,
  }));
}
