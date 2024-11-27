import { fromBuffer } from "yauzl-promise";
import { writeFileSync } from "fs";
import { rangeTrieify } from "@/lib/trie";

const unicodeRootUrl = "https://www.unicode.org/Public/UCD/latest/ucd/";
// const unicodeDataUrl = `${unicodeRootUrl}UnicodeData.txt`;
// const unicodeNameAliasesUrl = `${unicodeRootUrl}NameAliases.txt`;
const derivedNameUrl = `${unicodeRootUrl}extracted/DerivedName.txt`;
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

// function* iterateUnicodeData(fileContent: string): Generator<[string, string]> {
//   const lines = fileContent
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);
//   let rangeStart: number | null = null;
//   let rangeName: string | null = null;

//   const skipCategory = (category: string): boolean =>
//     /^C[cfson]?$/.test(category);

//   for (let i = 0; i < lines.length; i++) {
//     const [codeHex, nameField, category] = lines[i].split(";");
//     const code = parseInt(codeHex, 16);

//     if (nameField.includes(", First>")) {
//       // if (skipCategory(category)) continue;
//       rangeStart = code;
//       rangeName = nameField.match(/<(.+?),/)?.[1] ?? "";
//       continue;
//     }

//     if (nameField.includes(", Last>")) {
//       if (!rangeStart || !rangeName) {
//         throw new Error(`Range end found without start at line ${i + 1}`);
//       }

//       if (!skipCategory(category)) {
//         for (let n = rangeStart; n <= code; n++) {
//           yield [formatCodepoint(n), rangeName];
//         }
//       }

//       rangeStart = null;
//       rangeName = null;
//       continue;
//     }

//     if (rangeStart !== null) {
//       throw new Error(`Expected range end, got regular entry at line ${i + 1}`);
//     }

//     if (!skipCategory(category)) {
//       yield [formatCodepoint(code), nameField];
//     }
//   }

//   if (rangeStart !== null) {
//     throw new Error("File ended with unclosed range");
//   }
// }

// async function getUnicodeDataNames(): Promise<Map<string, string>> {
//   const response = await getUrlResponse(unicodeDataUrl);
//   const text = await response.text();

//   const names = new Map<string, string>();

//   for (const [code, name] of iterateUnicodeData(text)) {
//     names.set(code, name);
//   }

//   return names;
// }

// function* iterateNameAliases(fileContent: string): Generator<[string, string]> {
//   const lines = fileContent
//     .split("\n")
//     .map((l) => l.trim())
//     .filter((l) => l && !l.startsWith("#"));

//   for (const line of lines) {
//     const [codeHex, name, type] = line.split(";");
//     if (type?.toLowerCase() === "control") {
//       yield [codeHex.padStart(4, "0"), name];
//     }
//   }
// }

// async function getNameAliases(): Promise<Map<string, string>> {
//   const response = await getUrlResponse(unicodeNameAliasesUrl);
//   const text = await response.text();

//   const aliases = new Map<string, string>();

//   for (const [code, name] of iterateNameAliases(text)) {
//     // only take the first alias
//     if (!aliases.has(code)) {
//       aliases.set(code, name);
//     }
//   }

//   return aliases;
// }

function* iterateUnihanDefinitions(
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

async function getDefinitions(): Promise<Map<string, string>> {
  const response = await fetch(unihanZipUrl);
  const blob = await response.blob();
  const fileContent = await extractFileFromZip(blob, "Unihan_Readings.txt");

  const definitions = new Map<string, string>();

  for (const [code, definition] of iterateUnihanDefinitions(fileContent)) {
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
    const rangeEnd = codepoint.split("..")[1];
    if (rangeEnd === undefined) {
      yield [codepoint, name.replace("*", codepoint)];
    } else {
      const start = parseInt(codepoint, 16);
      const end = parseInt(rangeEnd, 16);
      for (let i = start; i <= end; i++) {
        const cp = formatCodepoint(i);
        const filledName = name.replace("*", cp);
        yield [cp, filledName];
      }
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

  // const names = await getUnicodeDataNames();
  // const aliases = await getNameAliases();
  const names = await getDerivedNames();
  const definitions = await getDefinitions();

  // merge the aliases into the main names map
  // for (const [code, name] of aliases) {
  //   names.set(code, name);
  // }

  // const names =

  // merge the definitions into the main names map
  for (const [code, definition] of definitions) {
    names.set(code, definition);
  }

  const trie = rangeTrieify(names);

  // write to foo.json
  writeFileSync(outputPath, JSON.stringify(trie));
}

// Check if this file is being run directly
if (require.main === module) {
  main().catch(console.error);
}
