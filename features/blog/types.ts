export type BlogPost = {
  slug: string;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  /** Optional ISO date for the last meaningful edit (dateModified). */
  updated?: string;
  /** Meta description, also used as the index excerpt. */
  description: string;
  /** Primary SEO keyword. */
  keyword: string;
  /**
   * Path under /public (file posts), e.g. /blog/my-cover.png, or an absolute
   * https URL (API posts). 1200x630 recommended.
   */
  cover: string;
  /** Display string, "Name, Role". */
  author: string;
  authorName: string;
  authorRole?: string;
  tags: string[];
  /** Raw markdown body (front matter removed). */
  content: string;
  readingMinutes: number;
};
