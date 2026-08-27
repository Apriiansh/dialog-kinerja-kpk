export function getAppBaseUrl(headers?: Headers) {
  const envUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const origin = headers?.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = headers?.get("x-forwarded-host") ?? headers?.get("host");
  const proto = headers?.get("x-forwarded-proto") ?? "http";

  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
