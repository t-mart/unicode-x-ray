import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { encodeNames, type NameRange } from "#/lib/names.ts";

export const chunkBits = 12;

export type Manifest = {
	unicodeVersion: string;
	generated: string;
	chunkBits: number;
	nameChunks: number[];
	defChunks: number[];
};

export type WriteOptions = {
	outputDir: string;
	inlineDir: string;
	version: string;
	names: readonly NameRange[];
	definitions: ReadonlyMap<number, string>;
	blocks: readonly NameRange[];
	compress: boolean;
};

/** Splits a range at chunk boundaries so each chunk resolves on its own. */
function* byChunk(range: NameRange): Generator<[number, NameRange]> {
	let start = range.start;

	while (start <= range.end) {
		const chunk = start >> chunkBits;
		const end = Math.min(range.end, ((chunk + 1) << chunkBits) - 1);
		yield [chunk, { start, end, name: range.name }];
		start = end + 1;
	}
}

export function groupNames(
	ranges: readonly NameRange[],
): Map<number, NameRange[]> {
	const chunks = new Map<number, NameRange[]>();

	for (const range of ranges) {
		for (const [chunk, part] of byChunk(range)) {
			const existing = chunks.get(chunk);
			if (existing) {
				existing.push(part);
			} else {
				chunks.set(chunk, [part]);
			}
		}
	}

	return chunks;
}

export function groupDefinitions(
	definitions: ReadonlyMap<number, string>,
): Map<number, [number, string][]> {
	const chunks = new Map<number, [number, string][]>();

	for (const codepoint of [...definitions.keys()].sort((a, b) => a - b)) {
		const definition = definitions.get(codepoint);
		if (definition === undefined) {
			continue;
		}

		const chunk = codepoint >> chunkBits;
		const existing = chunks.get(chunk);
		if (existing) {
			existing.push([codepoint, definition]);
		} else {
			chunks.set(chunk, [[codepoint, definition]]);
		}
	}

	return chunks;
}

/**
 * Chunks go to the public directory, because the browser fetches them by URL.
 * The manifest and the blocks go to the source directory, because the bundle
 * inlines them and Vite refuses to import anything under public.
 *
 * The manifest lands last, so a failed run never advertises missing chunks.
 */
export async function writeData(options: WriteOptions): Promise<Manifest> {
	const { outputDir, inlineDir } = options;

	await rm(outputDir, { recursive: true, force: true });
	await rm(inlineDir, { recursive: true, force: true });
	await mkdir(path.join(outputDir, "names"), { recursive: true });
	await mkdir(path.join(outputDir, "defs"), { recursive: true });
	await mkdir(inlineDir, { recursive: true });

	const write = (file: string, value: unknown) =>
		writeJson(path.join(outputDir, file), value, options.compress);

	const nameChunks = groupNames(options.names);
	const defChunks = groupDefinitions(options.definitions);

	await Promise.all([
		...[...nameChunks].map(([chunk, ranges]) =>
			write(`names/${chunk}.json`, encodeNames(ranges)),
		),
		...[...defChunks].map(([chunk, entries]) =>
			write(`defs/${chunk}.json`, entries),
		),
		writeJson(
			path.join(inlineDir, "blocks.json"),
			options.blocks.map((block) => [block.start, block.end, block.name]),
			false,
		),
	]);

	const manifest: Manifest = {
		unicodeVersion: options.version,
		generated: new Date().toISOString().slice(0, 10),
		chunkBits,
		nameChunks: [...nameChunks.keys()].sort((a, b) => a - b),
		defChunks: [...defChunks.keys()].sort((a, b) => a - b),
	};

	await writeJson(path.join(inlineDir, "manifest.json"), manifest, false);

	return manifest;
}

async function writeJson(file: string, value: unknown, compress: boolean) {
	const json = Buffer.from(JSON.stringify(value));
	await writeFile(file, json);

	if (!compress) {
		return;
	}

	await Promise.all([
		writeFile(
			`${file}.br`,
			brotliCompressSync(json, {
				params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
			}),
		),
		writeFile(`${file}.gz`, gzipSync(json, { level: 9 })),
	]);
}
