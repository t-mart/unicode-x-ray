import { describe, expect, it } from "vitest";
import type { NameNode } from "./names.ts";
import {
  blockOf,
  chunkOf,
  type DefinitionEntry,
  definitionIn,
  hasDefChunk,
  hasNameChunk,
  manifest,
  nameIn,
  unknownName,
} from "./unicode.ts";

describe("chunkOf", () => {
  it("puts a chunk boundary every 4096 code points", () => {
    expect(manifest.chunkBits).toBe(12);
    expect(chunkOf(0)).toBe(0);
    expect(chunkOf(0x0fff)).toBe(0);
    expect(chunkOf(0x1000)).toBe(1);
    expect(chunkOf(0x10ffff)).toBe(0x10f);
  });
});

describe("hasNameChunk", () => {
  it("reports what the manifest lists", () => {
    expect(hasNameChunk(chunkOf(0x41))).toBe(true);
    expect(hasNameChunk(chunkOf(0x15000))).toBe(false);
    expect(hasDefChunk(chunkOf(0x6f22))).toBe(true);
    expect(hasDefChunk(chunkOf(0x41))).toBe(false);
  });
});

describe("blockOf", () => {
  it("resolves both ends of a block", () => {
    expect(blockOf(0x00)).toBe("Basic Latin");
    expect(blockOf(0x7f)).toBe("Basic Latin");
    expect(blockOf(0x80)).toBe("Latin-1 Supplement");
  });

  it("returns null in the gap between two blocks", () => {
    expect(blockOf(0x2fe0)).toBeNull();
  });
});

describe("unknownName", () => {
  it("names the block so a reader sees stale data, not a hole", () => {
    expect(unknownName(0x80)).toBe("<unknown, Latin-1 Supplement>");
    expect(unknownName(0x2fe0)).toBe("<unknown>");
  });
});

describe("nameIn", () => {
  const nodes: NameNode[] = [[0x41, "LATIN CAPITAL LETTER A"]];

  it("reads a loaded chunk", () => {
    expect(nameIn(0x41, nodes)).toBe("LATIN CAPITAL LETTER A");
  });

  it("falls back when the chunk has not arrived", () => {
    expect(nameIn(0x41, undefined)).toBe("<unknown, Basic Latin>");
  });

  it("falls back when the chunk has no entry", () => {
    expect(nameIn(0x42, nodes)).toBe("<unknown, Basic Latin>");
  });
});

describe("definitionIn", () => {
  const entries: DefinitionEntry[] = [
    [0x4e00, "one"],
    [0x6f22, "the Chinese people"],
    [0x9fff, "last"],
  ];

  it("finds an entry at either end of the table", () => {
    expect(definitionIn(0x4e00, entries)).toBe("one");
    expect(definitionIn(0x9fff, entries)).toBe("last");
  });

  it("returns null for a missing entry or a missing chunk", () => {
    expect(definitionIn(0x4e01, entries)).toBeNull();
    expect(definitionIn(0x6f22, undefined)).toBeNull();
    expect(definitionIn(0x6f22, [])).toBeNull();
  });
});
