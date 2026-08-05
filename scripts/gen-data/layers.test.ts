import { describe, expect, it } from "vitest";
import type { NameRange } from "#/lib/names.ts";
import { assertNoOverlap, countCovered, mergeNames } from "./layers.ts";

const wide: NameRange[] = [{ start: 0x10, end: 0x1f, name: "WIDE" }];

describe("mergeNames", () => {
	it("returns the base when there is nothing to override", () => {
		expect(mergeNames(wide, new Map())).toEqual(wide);
	});

	it("splits a range around an override in the middle", () => {
		expect(mergeNames(wide, new Map([[0x15, "PICKED"]]))).toEqual([
			{ start: 0x10, end: 0x14, name: "WIDE" },
			{ start: 0x15, end: 0x15, name: "PICKED" },
			{ start: 0x16, end: 0x1f, name: "WIDE" },
		]);
	});

	it("overrides at either end without leaving an empty range", () => {
		expect(mergeNames(wide, new Map([[0x10, "FIRST"]]))).toEqual([
			{ start: 0x10, end: 0x10, name: "FIRST" },
			{ start: 0x11, end: 0x1f, name: "WIDE" },
		]);

		expect(mergeNames(wide, new Map([[0x1f, "LAST"]]))).toEqual([
			{ start: 0x10, end: 0x1e, name: "WIDE" },
			{ start: 0x1f, end: 0x1f, name: "LAST" },
		]);
	});

	it("replaces a range of one code point", () => {
		const base: NameRange[] = [{ start: 5, end: 5, name: "OLD" }];

		expect(mergeNames(base, new Map([[5, "NEW"]]))).toEqual([
			{ start: 5, end: 5, name: "NEW" },
		]);
	});

	it("adds an override that falls outside every range", () => {
		const overrides = new Map([
			[0x01, "BEFORE"],
			[0x30, "AFTER"],
		]);

		expect(mergeNames(wide, overrides)).toEqual([
			{ start: 0x01, end: 0x01, name: "BEFORE" },
			...wide,
			{ start: 0x30, end: 0x30, name: "AFTER" },
		]);
	});

	it("sorts the base and returns a sorted result", () => {
		const base: NameRange[] = [
			{ start: 0x20, end: 0x2f, name: "SECOND" },
			{ start: 0x10, end: 0x1f, name: "FIRST" },
		];
		const merged = mergeNames(base, new Map([[0x25, "MIDDLE"]]));

		expect(merged.map((range) => range.start)).toEqual([
			0x10, 0x20, 0x25, 0x26,
		]);
		assertNoOverlap(merged);
	});

	it("covers the same code points it started with", () => {
		const overrides = new Map([
			[0x12, "A"],
			[0x13, "B"],
			[0x1f, "C"],
		]);

		expect(countCovered(mergeNames(wide, overrides))).toBe(countCovered(wide));
	});
});

describe("assertNoOverlap", () => {
	it("throws when two ranges touch", () => {
		const ranges: NameRange[] = [
			{ start: 0, end: 4, name: "A" },
			{ start: 4, end: 8, name: "B" },
		];

		expect(() => assertNoOverlap(ranges)).toThrow(/U\+4/);
	});

	it("accepts ranges that only meet end to start", () => {
		const ranges: NameRange[] = [
			{ start: 0, end: 4, name: "A" },
			{ start: 5, end: 8, name: "B" },
		];

		expect(() => assertNoOverlap(ranges)).not.toThrow();
	});
});
