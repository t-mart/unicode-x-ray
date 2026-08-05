import { readFileSync } from "node:fs";
import path from "node:path";
import { fetchLatestVersion } from "./gen-data/ucd.ts";

/**
 * Compares the committed data against the live UCD. Writes GitHub Actions
 * outputs to stdout, so redirect stdout to $GITHUB_OUTPUT. The human readable
 * line goes to stderr, where the workflow log keeps it.
 */
const manifestPath = path.join(
  import.meta.dirname,
  "../src/data/manifest.json",
);
const { unicodeVersion } = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  unicodeVersion: string;
};

const latest = await fetchLatestVersion();

console.error(
  `data holds Unicode ${unicodeVersion}, the UCD publishes ${latest}`,
);
console.log(`latest=${latest}`);
console.log(`stale=${String(unicodeVersion !== latest)}`);
