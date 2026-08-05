import blocksJson from "../data/blocks.json";
import manifestJson from "../data/manifest.json";
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
const nameChunkIds = new Set(manifest.nameChunks);
const defChunkIds = new Set(manifest.defChunks);

export function chunkOf(codepoint: number): number {
  return codepoint >> manifest.chunkBits;
}

/** The manifest lists only chunks that exist, so unassigned costs no request. */
export function hasNameChunk(chunk: number): boolean {
  return nameChunkIds.has(chunk);
}

export function hasDefChunk(chunk: number): boolean {
  return defChunkIds.has(chunk);
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
export function unknownName(codepoint: number): string {
  const block = blockOf(codepoint);
  return block ? `<unknown, ${block}>` : "<unknown>";
}

/** Resolves a name against one loaded chunk. An absent chunk falls back. */
export function nameIn(
  codepoint: number,
  nodes: readonly NameNode[] | undefined,
): string {
  return (nodes && lookupName(codepoint, nodes)) ?? unknownName(codepoint);
}

export function definitionIn(
  codepoint: number,
  entries: readonly DefinitionEntry[] | undefined,
): string | null {
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
