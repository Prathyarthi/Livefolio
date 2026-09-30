const IMAGE_KEY_PATTERN =
  /^(?:users\/[A-Za-z0-9_-]+\/profile\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)|users\/[A-Za-z0-9_-]+\/projects\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)|orgs\/[A-Za-z0-9_-]+\/branding\/(?:org_logo|org_banner)\/[A-Za-z0-9_-]+\.(?:jpe?g|png|webp))$/;

/**
 * Object key for a public image URL on our R2 host.
 * Returns null for other hosts, private files (resumes, job sources), and
 * path tricks. The URL is never fetched — callers read the key from the bucket.
 */
export function publicImageKeyFromUrl(
  rawUrl: string,
  publicBaseUrl: string,
): string | null {
  const base = publicBaseUrl.trim().replace(/\/+$/, "");
  if (!base) return null;

  let asset: URL;
  let root: URL;
  try {
    asset = new URL(rawUrl);
    root = new URL(base);
  } catch {
    return null;
  }

  if (asset.origin !== root.origin) return null;
  if (asset.username || asset.password) return null;
  if (asset.protocol !== "https:" && asset.protocol !== "http:") return null;

  const rootPath = root.pathname.replace(/\/+$/, "");
  if (rootPath && rootPath !== "/" && !asset.pathname.startsWith(`${rootPath}/`)) {
    return null;
  }

  const prefixLength = rootPath && rootPath !== "/" ? rootPath.length : 0;
  let key = asset.pathname.slice(prefixLength).replace(/^\/+/, "");
  try {
    key = decodeURIComponent(key);
  } catch {
    return null;
  }

  if (!key || key.includes("\\") || key.includes("\0") || key.includes("..")) {
    return null;
  }
  if (!IMAGE_KEY_PATTERN.test(key)) return null;
  return key;
}

/**
 * Same-origin URL the dither canvas can upload as a WebGL texture.
 * Portfolio subdomains cannot read the R2 URL directly when bucket CORS
 * only allows the app origin.
 */
export function webglTextureUrl(src: string, pageHref: string): string {
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;

  let page: URL;
  let asset: URL;
  try {
    page = new URL(pageHref);
    asset = new URL(src, pageHref);
  } catch {
    return src;
  }

  if (asset.origin === page.origin) return src;
  return `/api/media/texture?url=${encodeURIComponent(asset.href)}`;
}