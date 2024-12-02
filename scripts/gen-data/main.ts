import { fromBuffer } from "yauzl-promise";
import { writeFileSync } from "fs";
import { rangeTrieify } from "@/lib/trie";

const unicodeRootUrl = "https://www.unicode.org/Public/UCD/latest/ucd/";
const unicodeDataUrl = `${unicodeRootUrl}UnicodeData.txt`;
const unihanZipUrl = `${unicodeRootUrl}Unihan.zip`;
const derivedNameUrl = `${unicodeRootUrl}extracted/DerivedName.txt`;

async function extractFileFromZip(
  blob: globalThis.Blob,
  filePath: string
): Promise<string> {
  const buffer = Buffer.from(await blob.arrayBuffer());

  const zipfile = await fromBuffer(buffer);

  for await (const entry of zipfile) {
    if (entry.filename === filePath) {
      const stream = await entry.openReadStream();
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks).toString();
    }
  }

  throw new Error("File not found in zip");
}

async function getUrlResponse(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
}

function formatCodepoint(n: number): string {
  return n.toString(16).toUpperCase().padStart(4, "0");
}

function* iterateUnicodeData(fileContent: string): Generator<[string, string]> {
  const lines = fileContent
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let rangeStart: number | null = null;
  let rangeName: string | null = null;
  const controlCategory = "Cc";

  const getControlName = (
    name: string,
    category: string,
    unicode1Name: string
  ) => {
    if (category === controlCategory) {
      return unicode1Name;
    }
    return name;
  };

  for (let i = 0; i < lines.length; i++) {
    const [codeHex, nameField, category, , , , , , , , unicode1Name] =
      lines[i].split(";");
    const code = parseInt(codeHex, 16);

    if (nameField.includes(", First>")) {
      rangeStart = code;
      rangeName = nameField.match(/<(.+?),/)?.[1] ?? "";
      continue;
    }

    if (nameField.includes(", Last>")) {
      if (!rangeStart || !rangeName) {
        throw new Error(`Range end found without start at line ${i + 1}`);
      }

      for (let n = rangeStart; n <= code; n++) {
        yield [
          formatCodepoint(n),
          getControlName(rangeName, category, unicode1Name),
        ];
      }

      rangeStart = null;
      rangeName = null;
      continue;
    }

    if (rangeStart !== null) {
      throw new Error(`Expected range end, got regular entry at line ${i + 1}`);
    }

    yield [
      formatCodepoint(code),
      getControlName(nameField, category, unicode1Name),
    ];
  }

  if (rangeStart !== null) {
    throw new Error("File ended with unclosed range");
  }
}

async function getUnicodeDataNames(): Promise<Map<string, string>> {
  const response = await getUrlResponse(unicodeDataUrl);
  const text = await response.text();

  const names = new Map<string, string>();

  for (const [code, name] of iterateUnicodeData(text)) {
    names.set(code, name);
  }

  return names;
}

function* iterateUnihanKDefinitions(
  fileContent: string
): Generator<[string, string]> {
  const lines = fileContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const line of lines) {
    const [codepoint, field, definition] = line.split("\t");
    if (field === "kDefinition") {
      yield [codepoint.slice(2), definition];
    }
  }
}

async function getKDefinitions(): Promise<Map<string, string>> {
  const response = await fetch(unihanZipUrl);
  const blob = await response.blob();
  const fileContent = await extractFileFromZip(blob, "Unihan_Readings.txt");

  const definitions = new Map<string, string>();

  for (const [code, definition] of iterateUnihanKDefinitions(fileContent)) {
    definitions.set(code, definition);
  }

  return definitions;
}

function* iterateDerivedNames(
  fileContent: string
): Generator<[string, string]> {
  const lines = fileContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const line of lines) {
    const [codepoint, name] = line.split(";").map((s) => s.trim());
    const [rangeStart, rangeEnd] = codepoint.split("..");

    if (rangeEnd) {
      const start = parseInt(rangeStart, 16);
      const end = parseInt(rangeEnd, 16);

      if (!name.endsWith("-*")) {
        throw new Error("Expected name to end with '-*'");
      }

      const unsuffixedName = name.slice(0, -2);

      for (let n = start; n <= end; n++) {
        yield [formatCodepoint(n), unsuffixedName];
      }
    } else {
      yield [codepoint, name];
    }
  }
}

async function getDerivedNames(): Promise<Map<string, string>> {
  const response = await getUrlResponse(derivedNameUrl);
  const text = await response.text();

  const names = new Map<string, string>();

  for (const [code, name] of iterateDerivedNames(text)) {
    names.set(code, name);
  }

  return names;
}

async function main() {
  // get the first argument: the path to which we will write the JSON
  const [outputPath] = process.argv.slice(2);

  if (!outputPath) {
    throw new Error("Output path is required");
  }

  // base names
  const names = await getUnicodeDataNames();

  // derived names. applies some nice things like:
  // - adds the syllable to Hangul (Korean) characters. e.g. "Hangul Syllable" -> "HANGUL SYLLABLE GA"
  // - makes some ranges more "human". e.g. "CJK Ideograph Extension A" -> "CJK UNIFIED IDEOGRAPH"
  const derivedNames = await getDerivedNames();

  // kDefinitions. adds definitions for some Chinese, Japanese, and Korean ideographic characters
  const kDefinitions = await getKDefinitions();

  // Combine. last value wins for a given key
  const combined = new Map([...names, ...derivedNames]);

  // kDefinitions are applied a little differently: we retain the value from
  // name, but append the kDefinition
  for (const [code, definition] of kDefinitions) {
    const name = combined.get(code);
    if (name) {
      combined.set(code, `${name} (${definition})`);
    } else {
      throw new Error(`kDefinition for codepoint ${code} has no name`);
    }
  }

  const trie = rangeTrieify(combined);

  // Write the trie to the output path
  writeFileSync(outputPath, JSON.stringify(trie));
}

if (require.main === module) {
  main().catch(console.error);
}
