import blocksJson from "../../public/data/blocks.json";
import manifestJson from "../../public/data/manifest.json";
import { lookupName, type NameNode } from "./names.ts";

export type Block = [start: number, end: number, name: string];
export type DefinitionEntry = [codepoint: number, definition: string];

export type Manifest = {
	unicodeVersion: string;
	generated: string;
	chunkBits: number;
	nameChunks: number[];
	defChunks: number[];
};

export const manifest = manifestJson as Manifest;

const blocks = blocksJson as Block[];
const nameChunks = new Map<number, NameNode[]>();
const defChunks = new Map<number, DefinitionEntry[]>();
const inFlight = new Map<string, Promise<void>>();

const nameChunkIds = new Set(manifest.nameChunks);
const defChunkIds = new Set(manifest.defChunks);

function chunkOf(codepoint: number): number {
	return codepoint >> manifest.chunkBits;
}

export function blockOf(codepoint: number): string | null {
	let low = 0;
	let high = blocks.length - 1;

	while (low <= high) {
		const mid = (low + high) >> 1;
		const block = blocks[mid];
		if (!block) {
			return null;
		}

		if (codepoint < block[0]) {
			high = mid - 1;
		} else if (codepoint > block[1]) {
			low = mid + 1;
		} else {
			return block[2];
		}
	}

	return null;
}

/**
 * The block name tells the reader that the software is behind rather than that
 * the code point is reserved. Unicode 17 names arrive in a browser that this
 * data file has never heard of.
 */
function unknownName(codepoint: number): string {
	const block = blockOf(codepoint);
	return block ? `<unknown, ${block}>` : "<unknown>";
}

/** Resolves a name from the chunks already loaded. Call `loadFor` first. */
export function nameOf(codepoint: number): string {
	const nodes = nameChunks.get(chunkOf(codepoint));
	return (nodes && lookupName(codepoint, nodes)) ?? unknownName(codepoint);
}

export function definitionOf(codepoint: number): string | null {
	const entries = defChunks.get(chunkOf(codepoint));
	if (!entries) {
		return null;
	}

	let low = 0;
	let high = entries.length - 1;

	while (low <= high) {
		const mid = (low + high) >> 1;
		const entry = entries[mid];
		if (!entry) {
			return null;
		}

		if (codepoint < entry[0]) {
			high = mid - 1;
		} else if (codepoint > entry[0]) {
			low = mid + 1;
		} else {
			return entry[1];
		}
	}

	return null;
}

async function load<T>(path: string, into: Map<number, T>, chunk: number) {
	const url = `${import.meta.env.BASE_URL}data/${path}/${chunk}.json`;
	const existing = inFlight.get(url);
	if (existing) {
		return existing;
	}

	const request = fetch(url)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`GET ${url} failed with status ${response.status}`);
			}
			into.set(chunk, (await response.json()) as T);
		})
		.catch((error: unknown) => {
			// A missing chunk degrades to the unknown fallback. It must not blank
			// the rest of the input.
			console.error(error);
		});

	inFlight.set(url, request);
	return request;
}

/**
 * Loads every chunk the given code points need. The manifest lists only chunks
 * that exist, so an unassigned code point costs no request.
 */
export async function loadFor(codepoints: Iterable<number>): Promise<void> {
	const requests: Promise<void>[] = [];

	for (const codepoint of codepoints) {
		const chunk = chunkOf(codepoint);

		if (nameChunkIds.has(chunk) && !nameChunks.has(chunk)) {
			requests.push(load("names", nameChunks, chunk));
		}

		if (defChunkIds.has(chunk) && !defChunks.has(chunk)) {
			requests.push(load("defs", defChunks, chunk));
		}
	}

	await Promise.all(requests);
}

// Chunk 0 covers Latin, Greek, Cyrillic, Hebrew, and Arabic, which is most of
// what people type. Start it on load so it arrives before the first keystroke.
if (!import.meta.env.SSR) {
	void loadFor([0]);
}
