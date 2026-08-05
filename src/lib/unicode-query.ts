import { queryOptions, useQueries } from "@tanstack/react-query";
import type { NameNode } from "./names.ts";
import {
	chunkOf,
	type DefinitionEntry,
	definitionIn,
	hasDefChunk,
	hasNameChunk,
	nameIn,
} from "./unicode.ts";

export type Character = {
	codepoint: number;
	name: string;
	definition: string | null;
	/** The name chunk exists but has not arrived, so the name is a placeholder. */
	pending: boolean;
};

type ChunkState<T> = { data: T | undefined; pending: boolean };

async function fetchChunk<T>(kind: string, chunk: number): Promise<T> {
	const url = `${import.meta.env.BASE_URL}data/${kind}/${chunk}.json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}

/** Chunk files never change once generated, so they never go stale. */
export function nameChunkQuery(chunk: number) {
	return queryOptions({
		queryKey: ["unicode", "names", chunk] as const,
		queryFn: () => fetchChunk<NameNode[]>("names", chunk),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}

export function defChunkQuery(chunk: number) {
	return queryOptions({
		queryKey: ["unicode", "defs", chunk] as const,
		queryFn: () => fetchChunk<DefinitionEntry[]>("defs", chunk),
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	});
}

/**
 * Chunk 0 covers Latin, Greek, Cyrillic, Hebrew, and Arabic, which is most of
 * what people type. It is 126 KB, too large to bundle, so start it early.
 */
export const commonNameChunk = 0;

/**
 * Loads every chunk the given code points need, then resolves each one. A chunk
 * that has not arrived yet resolves to the unknown fallback rather than to
 * nothing, so one slow request never blanks the rest of the input.
 */
export function useCodepointInfo(codepoints: readonly number[]): Character[] {
	const chunks = [...new Set(codepoints.map(chunkOf))].sort((a, b) => a - b);
	const nameChunks = chunks.filter(hasNameChunk);
	const defChunks = chunks.filter(hasDefChunk);

	const names = useQueries({
		queries: nameChunks.map(nameChunkQuery),
		combine: (results): Map<number, ChunkState<NameNode[]>> =>
			new Map(
				nameChunks.map((chunk, index) => [
					chunk,
					{
						data: results[index]?.data,
						pending: results[index]?.isPending ?? false,
					},
				]),
			),
	});

	const definitions = useQueries({
		queries: defChunks.map(defChunkQuery),
		combine: (results): Map<number, DefinitionEntry[] | undefined> =>
			new Map(defChunks.map((chunk, index) => [chunk, results[index]?.data])),
	});

	return codepoints.map((codepoint) => {
		const chunk = chunkOf(codepoint);
		const nameChunk = names.get(chunk);

		return {
			codepoint,
			name: nameIn(codepoint, nameChunk?.data),
			definition: definitionIn(codepoint, definitions.get(chunk)),
			pending: nameChunk?.pending ?? false,
		};
	});
}
