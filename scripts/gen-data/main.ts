import path from "node:path";
import { parseArgs } from "node:util";
import type { NameRange } from "#/lib/names.ts";
import {
	fetchLatestVersion,
	fetchUcdFiles,
	parseBlocks,
	parseDerivedName,
	parseUnicodeData,
	parseUnihanDefinitions,
	type UnicodeData,
} from "./ucd.ts";
import { writeData } from "./write.ts";

const defaultCacheDir = "node_modules/.cache/ucd";

/**
 * DerivedName.txt wins wherever it has a name. UnicodeData.txt supplies the
 * rest: the control characters, the surrogates, and the private use areas.
 */
function buildNameRanges(
	derived: readonly NameRange[],
	unicodeData: UnicodeData,
): NameRange[] {
	const ranges: NameRange[] = [...derived, ...unicodeData.reserved];

	for (const [codepoint, name] of unicodeData.controls) {
		ranges.push({ start: codepoint, end: codepoint, name });
	}

	ranges.sort((a, b) => a.start - b.start);

	for (let i = 1; i < ranges.length; i++) {
		const previous = ranges[i - 1];
		const current = ranges[i];
		if (previous && current && current.start <= previous.end) {
			throw new Error(
				`Overlapping names at U+${current.start.toString(16).toUpperCase()}`,
			);
		}
	}

	return ranges;
}

function countCovered(ranges: readonly NameRange[]): number {
	return ranges.reduce(
		(total, range) => total + range.end - range.start + 1,
		0,
	);
}

async function main() {
	const { values } = parseArgs({
		options: {
			output: { type: "string", default: "public/data" },
			"inline-output": { type: "string", default: "src/data" },
			version: { type: "string" },
			"cache-dir": { type: "string", default: defaultCacheDir },
			compress: { type: "boolean", default: false },
		},
	});

	const version = values.version ?? (await fetchLatestVersion());
	console.log(`Unicode ${version}`);

	const files = await fetchUcdFiles(version, path.resolve(values["cache-dir"]));

	const blocks = parseBlocks(files.blocks);
	const unicodeData = parseUnicodeData(files.unicodeData, blocks);
	const derived = parseDerivedName(files.derivedName);
	const definitions = parseUnihanDefinitions(files.unihanReadings);

	const names = buildNameRanges(derived, unicodeData);

	if (unicodeData.unnamed.length > 0) {
		const list = unicodeData.unnamed
			.map((code) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`)
			.join(", ");
		console.warn(`${unicodeData.unnamed.length} assigned but unnamed: ${list}`);
	}

	const covered = countCovered(names);
	const difference =
		unicodeData.assignedCount - unicodeData.unnamed.length - covered;

	if (difference !== 0) {
		throw new Error(
			`Name coverage does not match UnicodeData.txt: ${difference} code points differ`,
		);
	}

	const manifest = await writeData({
		outputDir: path.resolve(values.output),
		inlineDir: path.resolve(values["inline-output"]),
		version,
		names,
		definitions,
		blocks,
		compress: values.compress,
	});

	console.log(
		`${names.length} ranges, ${manifest.nameChunks.length} name chunks, ` +
			`${manifest.defChunks.length} definition chunks, ${blocks.length} blocks`,
	);
	console.log(`wrote ${values.output} and ${values["inline-output"]}`);
}

await main();
