import { describe, expect, it } from "vitest";
import { encodeNames, lookupName, type NameRange } from "./names.ts";

const ranges: NameRange[] = [
  { start: 0x41, end: 0x41, name: "LATIN CAPITAL LETTER A" },
  { start: 0x42, end: 0x42, name: "LATIN CAPITAL LETTER B" },
  { start: 0x4e00, end: 0x4e05, name: "CJK UNIFIED IDEOGRAPH" },
  { start: 0x4e06, end: 0x4e08, name: "CJK UNIFIED IDEOGRAPH" },
  { start: 0xac00, end: 0xac00, name: "HANGUL SYLLABLE GA" },
];

describe("encodeNames", () => {
  it("writes a bare string for a single code point", () => {
    expect(encodeNames([ranges[0] as NameRange])).toEqual([
      [0x41, "LATIN CAPITAL LETTER A"],
    ]);
  });

  it("merges adjacent ranges that share a name", () => {
    expect(encodeNames(ranges.slice(2, 4))).toEqual([
      [0x4e00, [9, "CJK UNIFIED IDEOGRAPH"]],
    ]);
  });

  it("keeps a gap between ranges that share a name", () => {
    const gapped: NameRange[] = [
      { start: 0x10, end: 0x11, name: "SAME" },
      { start: 0x20, end: 0x21, name: "SAME" },
    ];

    expect(encodeNames(gapped)).toHaveLength(2);
  });

  it("encodes nothing from nothing", () => {
    expect(encodeNames([])).toEqual([]);
  });
});

describe("lookupName", () => {
  const nodes = encodeNames(ranges);

  it("resolves every code point in every range", () => {
    for (const range of ranges) {
      for (let codepoint = range.start; codepoint <= range.end; codepoint++) {
        expect(lookupName(codepoint, nodes)).toBe(range.name);
      }
    }
  });

  it("returns null outside the table", () => {
    expect(lookupName(0x40, nodes)).toBeNull();
    expect(lookupName(0x43, nodes)).toBeNull();
    expect(lookupName(0x4e09, nodes)).toBeNull();
    expect(lookupName(0x10ffff, nodes)).toBeNull();
  });

  it("returns null for an empty table", () => {
    expect(lookupName(0x41, [])).toBeNull();
  });
});
