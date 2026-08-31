export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export function parsePageParams(
  query: { page?: string; pageSize?: string },
  defaults: { pageSize?: number; maxPageSize?: number } = {},
) {
  const maxPageSize = defaults.maxPageSize ?? MAX_PAGE_SIZE;
  const defaultSize = defaults.pageSize ?? DEFAULT_PAGE_SIZE;
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const requestedSize = Number.parseInt(
    query.pageSize ?? String(defaultSize),
    10,
  );
  const page = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const pageSize = Number.isFinite(requestedSize)
    ? Math.min(maxPageSize, Math.max(1, requestedSize))
    : defaultSize;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total,
    pageCount,
    items: items.slice(start, start + pageSize),
  };
}