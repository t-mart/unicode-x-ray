import { describe, expect, it } from "vitest";
import type { NameRange } from "#/lib/names.ts";
import { chunkBits, groupDefinitions, groupNames } from "./write.ts";

const chunkSize = 1 << chunkBits;

describe("groupNames", () => {
  it("keeps a range inside one chunk", () => {
    const chunks = groupNames([{ start: 0x41, end: 0x42, name: "A" }]);

    expect([...chunks.keys()]).toEqual([0]);
    expect(chunks.get(0)).toEqual([{ start: 0x41, end: 0x42, name: "A" }]);
  });

  it("splits a range at every chunk boundary", () => {
    const chunks = groupNames([
      { start: chunkSize - 1, end: chunkSize * 2, name: "WIDE" },
    ]);

    expect([...chunks.keys()]).toEqual([0, 1, 2]);
    expect(chunks.get(0)).toEqual([
      { start: chunkSize - 1, end: chunkSize - 1, name: "WIDE" },
    ]);
    expect(chunks.get(1)).toEqual([
      { start: chunkSize, end: chunkSize * 2 - 1, name: "WIDE" },
    ]);
    expect(chunks.get(2)).toEqual([
      { start: chunkSize * 2, end: chunkSize * 2, name: "WIDE" },
    ]);
  });

  it("loses no code point when it splits", () => {
    const range: NameRange = { start: 0x4e00, end: 0xa000, name: "CJK" };
    const parts = [...groupNames([range]).values()].flat();
    const covered = parts.reduce(
      (total, part) => total + part.end - part.start + 1,
      0,
    );

    expect(covered).toBe(range.end - range.start + 1);
  });
});

describe("groupDefinitions", () => {
  it("groups by chunk and sorts inside a chunk", () => {
    const chunks = groupDefinitions(
      new Map([
        [0x4e05, "second"],
        [0x4e00, "first"],
        [0x6f22, "other chunk"],
      ]),
    );

    expect(chunks.get(4)).toEqual([
      [0x4e00, "first"],
      [0x4e05, "second"],
    ]);
    expect(chunks.get(6)).toEqual([[0x6f22, "other chunk"]]);
  });

  it("groups nothing from nothing", () => {
    expect(groupDefinitions(new Map()).size).toBe(0);
  });
});
