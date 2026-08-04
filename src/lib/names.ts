/**
 * A run-length encoded name table. Contiguous code points that share a name
 * collapse into one node, which keeps the CJK and Hangul blocks small.
 */
export type NameNode = [
	codepoint: number,
	value: string | [length: number, name: string],
];

export type NameRange = {
	readonly start: number;
	readonly end: number;
	readonly name: string;
};

function nodeName(value: NameNode[1]): string {
	return typeof value === "string" ? value : value[1];
}

function nodeLength(value: NameNode[1]): number {
	return typeof value === "string" ? 1 : value[0];
}

/** Encodes sorted, non-overlapping ranges. Adjacent ranges with equal names merge. */
export function encodeNames(ranges: readonly NameRange[]): NameNode[] {
	const nodes: NameNode[] = [];

	for (const range of ranges) {
		const length = range.end - range.start + 1;
		const last = nodes.at(-1);

		if (last) {
			const previousLength = nodeLength(last[1]);
			if (
				nodeName(last[1]) === range.name &&
				last[0] + previousLength === range.start
			) {
				last[1] = [previousLength + length, range.name];
				continue;
			}
		}

		nodes.push([range.start, length === 1 ? range.name : [length, range.name]]);
	}

	return nodes;
}

export function lookupName(
	codepoint: number,
	nodes: readonly NameNode[],
): string | null {
	let low = 0;
	let high = nodes.length - 1;

	while (low <= high) {
		const mid = (low + high) >> 1;
		const node = nodes[mid];
		if (!node) {
			return null;
		}

		if (codepoint < node[0]) {
			high = mid - 1;
		} else if (codepoint >= node[0] + nodeLength(node[1])) {
			low = mid + 1;
		} else {
			return nodeName(node[1]);
		}
	}

	return null;
}
