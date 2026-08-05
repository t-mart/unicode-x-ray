/**
 * Social previews for the prerendered pages.
 *
 * Scrapers do not run JavaScript, and the build writes one file per route, not
 * per query string. Every `/?text=...` link therefore shares the preview of the
 * home page. Absolute URLs are required here: relative ones fail in most
 * scrapers.
 *
 * `.env.development` points the origin at the dev server, `.env.production` at
 * the live site. Vite inlines the value at build time.
 */
const origin = import.meta.env.VITE_SITE_ORIGIN;

if (!origin) {
  throw new Error("VITE_SITE_ORIGIN is not set");
}

/**
 * Tags that never change. The root route holds these. A deeper route replaces
 * any of them by repeating its `name` or `property`.
 */
export const siteMeta = [
  { property: "og:site_name", content: "Unicode X-Ray" },
  { property: "og:type", content: "website" },
  { property: "og:locale", content: "en_US" },
  { property: "og:image", content: `${origin}/og.png` },
  { property: "og:image:type", content: "image/png" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  {
    property: "og:image:alt",
    content: "The word cafe broken into its five code points",
  },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: `${origin}/og.png` },
];

/** The per-page tags, kept in step with the title and description. */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const url = new URL(path, origin).href;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:url", content: url },
  ];
}
