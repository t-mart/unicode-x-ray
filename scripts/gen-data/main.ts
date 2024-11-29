import { fromBuffer } from "yauzl-promise";
import { writeFileSync } from "fs";
import { rangeTrieify } from "@/lib/trie";

const unicodeRootUrl = "https://www.unicode.org/Public/UCD/latest/ucd/";
const unicodeDataUrl = `${unicodeRootUrl}UnicodeData.txt`;
const unicodeJamoUrl = `${unicodeRootUrl}Jamo.txt`;
const unihanZipUrl = `${unicodeRootUrl}Unihan.zip`;

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

function* iterateJamoNames(fileContent: string): Generator<[string, string]> {
  const lines = fileContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const line of lines) {
    const [firstPart, name] = line.split("#");
    const [codepoint] = firstPart.split(";");
    yield [codepoint, name].map((s) => s.trim()) as [string, string];
  }
}

async function getJamoNames(): Promise<Map<string, string>> {
  const response = await getUrlResponse(unicodeJamoUrl);
  const text = await response.text();

  const names = new Map<string, string>();

  for (const [code, name] of iterateJamoNames(text)) {
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

async function main() {
  // get the first argument: the path to which we will write the JSON
  const [outputPath] = process.argv.slice(2);

  if (!outputPath) {
    throw new Error("Output path is required");
  }

  const names = await getUnicodeDataNames();
  const jamoNames = await getJamoNames();
  const kDefinitions = await getKDefinitions();

  // Combine. last value wins for a given key
  const combined = new Map([...names, ...jamoNames]);

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
