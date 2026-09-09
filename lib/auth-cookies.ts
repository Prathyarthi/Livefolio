/**
 * Match how next-auth names the session cookie when useSecureCookies
 * follows an https NEXTAUTH_URL.
 */
export function shouldUseSecureCookies() {
  return process.env.NEXTAUTH_URL?.startsWith("https://") === true;
}