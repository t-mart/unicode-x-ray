export const normalizations = ["NFC", "NFD", "NFKC", "NFKD"] as const;
export type Normalization = (typeof normalizations)[number];

export type Search = { text?: string; norm?: Normalization };

/**
 * The URL is the only state. Nothing copies it into a component, so a shared
 * link and a typed character take the same path.
 *
 * The two fields are independent. A normalization survives an empty box, so it
 * still applies to whatever the reader types next.
 */
export function buildSearch(
  text: string,
  norm: Normalization | undefined,
): Search {
  return {
    ...(text ? { text } : {}),
    ...(norm ? { norm } : {}),
  };
}

/** Drops anything the URL carries that this page does not define. */
export function parseSearch(search: Record<string, unknown>): Search {
  const text = typeof search.text === "string" ? search.text : "";
  const norm = normalizations.find((value) => value === search.norm);
  return buildSearch(text, norm);
}
