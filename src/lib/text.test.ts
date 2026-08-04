import { describe, expect, it } from "vitest";
import { codepointValues, segment } from "./text.ts";

const decomposedE = "e\u0301";
const astronaut = "\u{1F469}\u{1F3FD}\u200D\u{1F680}";
const flags = "\u{1F1EC}\u{1F1E7}\u{1F1EF}\u{1F1F5}";
const hindi = "हिन्दी";

function shape(text: string): string[] {
	return segment(text).map((grapheme) => grapheme.string);
}

describe("segment", () => {
	it("returns nothing for empty text", () => {
		expect(segment("")).toEqual([]);
	});

	it("keeps a combining mark with the letter before it", () => {
		expect(shape(decomposedE)).toEqual([decomposedE]);
		expect(codepointValues(segment(decomposedE))).toEqual([0x65, 0x301]);
	});

	it("keeps a skin tone modifier and a zero width joiner in one cluster", () => {
		expect(shape(astronaut)).toEqual([astronaut]);
	});

	it("splits a pair of flags", () => {
		expect(shape(flags)).toEqual(["\u{1F1EC}\u{1F1E7}", "\u{1F1EF}\u{1F1F5}"]);
	});

	it("keeps a carriage return and a line feed together", () => {
		expect(shape("\r\n")).toEqual(["\r\n"]);
	});

	it("keeps an astral code point whole", () => {
		expect(codepointValues(segment("\u{1F389}"))).toEqual([0x1f389]);
	});

	it("offsets every grapheme and code point in the input string", () => {
		const graphemes = segment(`a${astronaut}b`);

		expect(graphemes.map((grapheme) => grapheme.offset)).toEqual([0, 1, 8]);
		expect(
			graphemes[1]?.codepoints.map((codepoint) => codepoint.offset),
		).toEqual([1, 3, 5, 6]);
	});

	/** Evidence for D15: a cluster is not what a reader of Devanagari perceives. */
	it("splits Devanagari where the eye does not", () => {
		expect(shape(hindi)).toEqual(["हि", "न्दी"]);
	});
});

describe("codepointValues", () => {
	it("flattens graphemes in input order", () => {
		expect(codepointValues(segment("a\u{1F44D}\u{1F3FB}b"))).toEqual([
			0x61, 0x1f44d, 0x1f3fb, 0x62,
		]);
	});
});
