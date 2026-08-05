import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import StreamZip from "node-stream-zip";
import type { NameRange } from "#/lib/names.ts";

const readMeUrl = "https://www.unicode.org/Public/UCD/latest/ReadMe.txt";
const versionPattern = /Version (\d+\.\d+\.\d+) of the Unicode Standard/;

export type UcdFiles = {
	unicodeData: string;
	derivedName: string;
	nameAliases: string;
	blocks: string;
	unihanReadings: string;
	unikemet: string;
};

/** Reads the version from the live UCD directory. A run must pin one version. */
export async function fetchLatestVersion(): Promise<string> {
	const text = await fetchText(readMeUrl);
	const match = text.match(versionPattern);

	if (!match?.[1]) {
		throw new Error(`No Unicode version found in ${readMeUrl}`);
	}

	return match[1];
}

export async function fetchUcdFiles(
	version: string,
	cacheDir: string,
): Promise<UcdFiles> {
	const root = `https://www.unicode.org/Public/${version}/ucd/`;
	const dir = path.join(cacheDir, version);
	await mkdir(dir, { recursive: true });

	const [
		unicodeData,
		derivedName,
		nameAliases,
		blocks,
		unihanReadings,
		unikemet,
	] = await Promise.all([
		cachedText(dir, "UnicodeData.txt", `${root}UnicodeData.txt`),
		cachedText(dir, "DerivedName.txt", `${root}extracted/DerivedName.txt`),
		cachedText(dir, "NameAliases.txt", `${root}NameAliases.txt`),
		cachedText(dir, "Blocks.txt", `${root}Blocks.txt`),
		cachedUnihanReadings(dir, `${root}Unihan.zip`),
		cachedText(dir, "Unikemet.txt", `${root}Unikemet.txt`),
	]);

	return {
		unicodeData,
		derivedName,
		nameAliases,
		blocks,
		unihanReadings,
		unikemet,
	};
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}`);
	}
	return response.text();
}

async function cachedText(
	dir: string,
	name: string,
	url: string,
): Promise<string> {
	const file = path.join(dir, name);

	try {
		return await readFile(file, "utf8");
	} catch {
		console.log(`download ${url}`);
		const text = await fetchText(url);
		await writeFile(file, text);
		return text;
	}
}

async function cachedUnihanReadings(dir: string, url: string): Promise<string> {
	const entry = "Unihan_Readings.txt";
	const file = path.join(dir, entry);

	try {
		return await readFile(file, "utf8");
	} catch {
		console.log(`download ${url}`);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`GET ${url} failed with status ${response.status}`);
		}

		const archive = path.join(dir, "Unihan.zip");
		await writeFile(archive, Buffer.from(await response.arrayBuffer()));

		const zip = new StreamZip.async({ file: archive });
		try {
			const text = (await zip.entryData(entry)).toString("utf8");
			await writeFile(file, text);
			return text;
		} finally {
			await zip.close();
		}
	}
}

function* dataLines(text: string): Generator<string> {
	for (const line of text.split("\n")) {
		const trimmed = line.split("#")[0]?.trim();
		if (trimmed) {
			yield trimmed;
		}
	}
}

export type UnicodeData = {
	/** Names for control characters, which DerivedName.txt omits. */
	readonly controls: ReadonlyMap<number, string>;
	/** Surrogate and private use blocks, kept as ranges rather than expanded. */
	readonly reserved: readonly NameRange[];
	/** How many code points are assigned, used to check the name table for gaps. */
	readonly assignedCount: number;
	/** Controls with an empty Unicode 1.0 name field. NameAliases.txt covers them. */
	readonly unnamedControls: readonly number[];
};

/**
 * UnicodeData.txt gives names for control characters in field 10, and marks
 * large uniform blocks with a First and Last row pair.
 */
export function parseUnicodeData(text: string, blocks: readonly NameRange[]) {
	const controls = new Map<number, string>();
	const reserved: NameRange[] = [];
	const unnamedControls: number[] = [];
	let assignedCount = 0;

	let rangeStart: number | null = null;

	for (const line of dataLines(text)) {
		const fields = line.split(";");
		const [codeHex, nameField, category] = fields;
		const unicode1Name = fields[10];

		if (!codeHex || nameField === undefined || !category) {
			throw new Error(`Malformed UnicodeData.txt row: ${line}`);
		}

		const code = Number.parseInt(codeHex, 16);

		if (nameField.endsWith(", First>")) {
			if (rangeStart !== null) {
				throw new Error(`Unclosed range before U+${codeHex}`);
			}
			rangeStart = code;
			continue;
		}

		if (nameField.endsWith(", Last>")) {
			if (rangeStart === null) {
				throw new Error(`Range end without a start at U+${codeHex}`);
			}

			assignedCount += code - rangeStart + 1;

			// Surrogates and private use have no per code point name. Everything
			// else in this shape is named by DerivedName.txt instead.
			if (category === "Cs" || category === "Co") {
				reserved.push({
					start: rangeStart,
					end: code,
					name: blockName(blocks, rangeStart),
				});
			}

			rangeStart = null;
			continue;
		}

		if (rangeStart !== null) {
			throw new Error(`Expected a range end, found U+${codeHex}`);
		}

		assignedCount++;

		if (category === "Cc") {
			if (unicode1Name) {
				controls.set(code, unicode1Name);
			} else {
				unnamedControls.push(code);
			}
		}
	}

	if (rangeStart !== null) {
		throw new Error("UnicodeData.txt ended with an unclosed range");
	}

	return {
		controls,
		reserved,
		assignedCount,
		unnamedControls,
	} satisfies UnicodeData;
}

function blockName(blocks: readonly NameRange[], codepoint: number): string {
	const block = blocks.find(
		(candidate) => codepoint >= candidate.start && codepoint <= candidate.end,
	);

	if (!block) {
		throw new Error(`No block contains U+${codepoint.toString(16)}`);
	}

	return block.name;
}

/**
 * DerivedName.txt is the authority for names. It covers every assigned code
 * point except the controls, the surrogates, and the private use areas.
 */
export function parseDerivedName(text: string): NameRange[] {
	const ranges: NameRange[] = [];

	for (const line of dataLines(text)) {
		const [codeField, nameField] = line.split(";").map((part) => part.trim());

		if (!codeField || !nameField) {
			throw new Error(`Malformed DerivedName.txt row: ${line}`);
		}

		const [startHex, endHex] = codeField.split("..");
		const start = Number.parseInt(startHex ?? "", 16);

		if (endHex === undefined) {
			ranges.push({ start, end: start, name: nameField });
			continue;
		}

		// A range row names every code point with a hex suffix, as in
		// "CJK UNIFIED IDEOGRAPH-4E00". Drop the suffix so the range collapses.
		if (!nameField.endsWith("-*")) {
			throw new Error(`Range name without a suffix marker: ${line}`);
		}

		ranges.push({
			start,
			end: Number.parseInt(endHex, 16),
			name: nameField.slice(0, -2),
		});
	}

	return ranges;
}

export function parseBlocks(text: string): NameRange[] {
	const blocks: NameRange[] = [];

	for (const line of dataLines(text)) {
		const [codeField, name] = line.split(";").map((part) => part.trim());
		const [startHex, endHex] = codeField?.split("..") ?? [];

		if (!startHex || !endHex || !name) {
			throw new Error(`Malformed Blocks.txt row: ${line}`);
		}

		blocks.push({
			start: Number.parseInt(startHex, 16),
			end: Number.parseInt(endHex, 16),
			name,
		});
	}

	return blocks;
}

/**
 * A character name never changes, even when it is wrong. NameAliases.txt is
 * where Unicode publishes the fix. Types in falling order of authority:
 *
 * - `correction` repairs a name that is misleading or misspelled.
 * - `alternate` is the name people actually use. One entry: U+FEFF.
 * - `control` is the ISO 6429 name for a C0 or C1 control.
 * - `figment` is a label that no standard ever approved. Three C1 controls
 *   have nothing else, so it beats no name at all.
 *
 * `abbreviation` is skipped. LF and BOM are short forms, not names.
 */
const aliasRanking = ["correction", "alternate", "control", "figment"];

export function parseNameAliases(text: string): Map<number, string> {
	const best = new Map<number, { name: string; rank: number }>();

	for (const line of dataLines(text)) {
		const [codeHex, name, type] = line.split(";");

		if (!codeHex || !name || !type) {
			throw new Error(`Malformed NameAliases.txt row: ${line}`);
		}

		const rank = aliasRanking.indexOf(type);
		if (rank < 0) {
			continue;
		}

		const code = Number.parseInt(codeHex, 16);
		const current = best.get(code);

		if (!current || rank < current.rank) {
			best.set(code, { name, rank });
		}
	}

	return new Map([...best].map(([code, { name }]) => [code, name]));
}

/**
 * Unihan and Unikemet share one format: a code point, a tag, and a value,
 * separated by tabs. `kDefinition` glosses a CJK ideograph. `kEH_Desc`
 * describes what an Egyptian hieroglyph depicts.
 */
export function parseTaggedValues(
	text: string,
	tag: string,
): Map<number, string> {
	const values = new Map<number, string>();

	for (const line of text.split("\n")) {
		if (!line || line.startsWith("#")) {
			continue;
		}

		const [codeField, field, value] = line.split("\t");

		if (field === tag && codeField && value) {
			values.set(Number.parseInt(codeField.slice(2), 16), value.trim());
		}
	}

	return values;
}
