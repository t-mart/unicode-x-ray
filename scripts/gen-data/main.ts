import path from "node:path";
import { parseArgs } from "node:util";
import type { NameRange } from "#/lib/names.ts";
import { assertNoOverlap, countCovered, mergeNames } from "./layers.ts";
import {
	fetchLatestVersion,
	fetchUcdFiles,
	parseBlocks,
	parseDerivedName,
	parseNameAliases,
	parseTaggedValues,
	parseUnicodeData,
	type UnicodeData,
} from "./ucd.ts";
import { writeData } from "./write.ts";

const defaultCacheDir = "node_modules/.cache/ucd";

/**
 * Four layers, from lowest precedence to highest:
 *
 * 1. UnicodeData.txt, for the surrogate and private use ranges.
 * 2. DerivedName.txt, which names everything else that has a name.
 * 3. The Unicode 1.0 name field, which is the only name a control has there.
 * 4. NameAliases.txt, which corrects a wrong name and names the rest of the
 *    controls.
 *
 * Layers 3 and 4 name one code point at a time, so they split any range they
 * land inside.
 */
function buildNameRanges(
	derived: readonly NameRange[],
	aliases: ReadonlyMap<number, string>,
	unicodeData: UnicodeData,
): NameRange[] {
	const overrides = new Map([...unicodeData.controls, ...aliases]);
	const ranges = mergeNames([...derived, ...unicodeData.reserved], overrides);

	assertNoOverlap(ranges);

	return ranges;
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
	const aliases = parseNameAliases(files.nameAliases);

	const definitions = new Map([
		...parseTaggedValues(files.unihanReadings, "kDefinition"),
		...parseTaggedValues(files.unikemet, "kEH_Desc"),
	]);

	const names = buildNameRanges(derived, aliases, unicodeData);

	const unnamed = unicodeData.unnamedControls.filter(
		(code) => !aliases.has(code),
	);

	if (unnamed.length > 0) {
		const list = unnamed
			.map((code) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`)
			.join(", ");
		console.warn(`${unnamed.length} assigned but unnamed: ${list}`);
	}

	const covered = countCovered(names);
	const difference = unicodeData.assignedCount - unnamed.length - covered;

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
		`${names.length} ranges, ${aliases.size} aliases, ${definitions.size} definitions`,
	);
	console.log(
		`${manifest.nameChunks.length} name chunks, ` +
			`${manifest.defChunks.length} definition chunks, ${blocks.length} blocks`,
	);
	console.log(`wrote ${values.output} and ${values["inline-output"]}`);
}

await main();
