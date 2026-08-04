import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lookupName, type NameNode } from "./names.ts";
import { chunkOf, type DefinitionEntry, manifest } from "./unicode.ts";

const dataDir = path.resolve("public/data");
const chunkSize = 1 << manifest.chunkBits;

function read<T>(file: string): T {
	return JSON.parse(readFileSync(path.join(dataDir, file), "utf8")) as T;
}

const names = new Map(
	manifest.nameChunks.map((chunk) => [
		chunk,
		read<NameNode[]>(`names/${chunk}.json`),
	]),
);

const definitions = new Map(
	manifest.defChunks.map((chunk) => [
		chunk,
		read<DefinitionEntry[]>(`defs/${chunk}.json`),
	]),
);

function nodeLength(value: NameNode[1]): number {
	return typeof value === "string" ? 1 : value[0];
}

/**
 * The C1 controls that UnicodeData.txt assigns without a name. They resolve to
 * the block fallback, which is the best any name table can do.
 */
const unnamed = [0x80, 0x81, 0x84, 0x99];

describe("generated data", () => {
	it("lists chunks that exist and are not empty", () => {
		expect(manifest.nameChunks.length).toBeGreaterThan(0);
		expect(manifest.defChunks.length).toBeGreaterThan(0);

		for (const [, nodes] of [...names, ...definitions]) {
			expect(nodes.length).toBeGreaterThan(0);
		}
	});

	it("keeps every name node inside its own chunk, in order", () => {
		for (const [chunk, nodes] of names) {
			const low = chunk * chunkSize;
			let previousEnd = low - 1;

			for (const [start, value] of nodes) {
				const end = start + nodeLength(value) - 1;
				expect(start).toBeGreaterThan(previousEnd);
				expect(chunkOf(start)).toBe(chunk);
				expect(chunkOf(end)).toBe(chunk);
				previousEnd = end;
			}
		}
	});

	it("sorts every definition chunk", () => {
		for (const [chunk, entries] of definitions) {
			let previous = -1;

			for (const [codepoint] of entries) {
				expect(codepoint).toBeGreaterThan(previous);
				expect(chunkOf(codepoint)).toBe(chunk);
				previous = codepoint;
			}
		}
	});

	it("gives the four unnamed controls no name", () => {
		for (const codepoint of unnamed) {
			const nodes = names.get(chunkOf(codepoint)) ?? [];
			expect(lookupName(codepoint, nodes)).toBeNull();
		}
	});
});

/**
 * The runtime is an independent oracle, but only while it agrees with the data
 * file about which version of Unicode it describes.
 */
const runtimeVersion = process.versions.unicode ?? "";
const sameVersion = manifest.unicodeVersion.startsWith(runtimeVersion);

describe.skipIf(!sameVersion)(
	`names against runtime Unicode ${runtimeVersion}`,
	() => {
		it("names every code point the runtime calls assigned", () => {
			const missing: number[] = [];
			const extra: number[] = [];

			for (let codepoint = 0; codepoint <= 0x10ffff; codepoint++) {
				if (codepoint >= 0xd800 && codepoint <= 0xdfff) {
					continue;
				}

				const assigned = /\p{Assigned}/u.test(String.fromCodePoint(codepoint));
				const named =
					lookupName(codepoint, names.get(chunkOf(codepoint)) ?? []) !== null;

				if (assigned && !named) {
					missing.push(codepoint);
				} else if (named && !assigned) {
					extra.push(codepoint);
				}
			}

			expect(missing).toEqual(unnamed);
			expect(extra).toEqual([]);
		});
	},
);
