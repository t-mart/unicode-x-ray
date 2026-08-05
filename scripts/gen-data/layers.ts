import type { NameRange } from "#/lib/names.ts";

/**
 * Lays single code point names over a base of ranges. A name inside a range
 * splits it. A name outside every range becomes a range of its own, which is
 * how the controls arrive: DerivedName.txt does not name them.
 *
 * Both sides are walked once together, so the result comes out sorted.
 */
export function mergeNames(
	base: readonly NameRange[],
	overrides: ReadonlyMap<number, string>,
): NameRange[] {
	const sorted = [...base].sort((a, b) => a.start - b.start);
	const points = [...overrides.keys()].sort((a, b) => a - b);
	const merged: NameRange[] = [];
	let index = 0;

	const peek = (): number | undefined => points[index];

	const take = (point: number) => {
		const name = overrides.get(point);
		if (name === undefined) {
			throw new Error(`No override name for U+${point.toString(16)}`);
		}

		merged.push({ start: point, end: point, name });
		index++;
	};

	for (const range of sorted) {
		let point = peek();

		while (point !== undefined && point < range.start) {
			take(point);
			point = peek();
		}

		let start = range.start;

		while (point !== undefined && point <= range.end) {
			if (point > start) {
				merged.push({ start, end: point - 1, name: range.name });
			}

			take(point);
			start = point + 1;
			point = peek();
		}

		if (start <= range.end) {
			merged.push({ start, end: range.end, name: range.name });
		}
	}

	for (let point = peek(); point !== undefined; point = peek()) {
		take(point);
	}

	return merged;
}

/** Throws on the first pair that overlaps. The ranges must already be sorted. */
export function assertNoOverlap(ranges: readonly NameRange[]): void {
	for (let i = 1; i < ranges.length; i++) {
		const previous = ranges[i - 1];
		const current = ranges[i];

		if (previous && current && current.start <= previous.end) {
			throw new Error(
				`Overlapping names at U+${current.start.toString(16).toUpperCase()}`,
			);
		}
	}
}

export function countCovered(ranges: readonly NameRange[]): number {
	return ranges.reduce(
		(total, range) => total + range.end - range.start + 1,
		0,
	);
}
