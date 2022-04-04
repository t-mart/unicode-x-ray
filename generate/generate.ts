import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import axios from 'axios';
import JSZip from 'jszip';
import fxp from 'fast-xml-parser';

// can't seem to get this to work without the ".js". something in tsconfig?
import type { CharacterNameEntry } from '../src/lib/types.js';
// import { createTrie } from '../src/lib/trie.js';

// we're running this as an ESM, so we need to shim these in
// https://stackoverflow.com/a/64383997/235992
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UCD_ZIP_URL = 'https://www.unicode.org/Public/14.0.0/ucdxml/ucd.all.flat.zip';
const EMOJI_TEST_URL = 'https://www.unicode.org/Public/emoji/14.0/emoji-test.txt';
const EMOJI_SEQUENCE_PATTERN =
  /^(([0-9ABCDEF]{4,6})( [0-9ABCDEF]{4,6})*) *; \S+ *# [^ ]+ E\d+(?:\.\d+) (.+)$/gmu;
const UCD_XML_FILE_NAME = 'ucd.all.flat.xml';
const NAMES_OUTPUT_PATH = join(__dirname, '../static/names.json');
const COMBINING_OUTPUT_PATH = join(__dirname, '../static/combining.json');
const EMOJI_SEQUENCES_OUTPUT_PATH = join(__dirname, '../static/emoji-sequences.json');
const NAMED_SEQUENCES_OUTPUT_PATH = join(__dirname, '../static/named-sequences.json');
const STANDARDIZED_VARIANTS_OUTPUT_PATH = join(__dirname, '../static/standardized-variants.json');

// CAREFUL about changing this. some interfaces fields below are coupled to this.
const XML_PARSER_OPTIONS: Partial<fxp.X2jOptions> = {
  ignoreAttributes: false, // we want the attributes fo sho
  attributesGroupName: 'attributes', // put all attributes under a property with this name
  attributeNamePrefix: '' // and don't give the attributes a prefix
};

type UCDChar = {
  attributes: UCDCharAttributes;
  'name-alias'?: UCDCharNameAlias[];
};

/**
 * In the xml file at UCD_ZIP_URL, there are <character> tags found in "ucd > repertoire". This
 * object represents the attributes of that tag. They tell us stuff about the codepoints.
 */
type UCDCharAttributes = {
  cp?: string;
  na?: string;
  na1?: string;
  kDefinition?: string;
  ccc: string;
};

type UCDCharNameAlias = {
  attributes: UCDCharNameAliasAttributes;
};

/**
 * Sometimes, there are <name-alias> children of <character> tags, which we use sometimes to get a
 * good-looking name for a character.
 */
type UCDCharNameAliasAttributes = {
  alias: string;
  type: string;
};

type UCDNamedSequenceAttributes = {
  name: string;
  cps: string;
};

type UCDNamedSequence = {
  attributes: UCDNamedSequenceAttributes;
};

type UCDStandardizedVariantAttributes = {
  desc: string;
  cps: string;
};

type UCDStandardizedVariant = {
  attributes: UCDStandardizedVariantAttributes;
};

type UCDXML = {
  ucd: {
    repertoire: {
      char: UCDChar[];
    };
    'named-sequences': {
      'named-sequence': UCDNamedSequence[];
    };
    'standardized-variants': {
      'standardized-variant': UCDStandardizedVariant[];
    };
  };
};

/**
 * Split a string like "0B95 0BCD 0BB7 0BCD" into its constituent codepoints (as number objects)
 * @returns An Array of codepoint numbers
 */
function splitCodepointsString(seq: string): number[] {
  return seq.split(' ').map((codepointHex) => parseInt(codepointHex, 16));
}

/**
 * In memory, HTTP GET the UCD (UniCode Data) zip, extract the XML file, and parse it into a JS
 * object.
 * @returns A promise of an array of UCDChar objects
 */
async function parseUCDXML(): Promise<UCDXML> {
  return axios
    .get(UCD_ZIP_URL, {
      responseType: 'arraybuffer'
    })
    .then((response) => {
      console.log(`Downloaded ${UCD_ZIP_URL}`);
      return JSZip.loadAsync(response.data);
    })
    .then((zip) => {
      console.log('Read zip archive');
      const file = zip.file(UCD_XML_FILE_NAME);
      if (file === null) {
        throw new Error(`Cannot find file with name ${UCD_XML_FILE_NAME} in the zip archive`);
      }
      return file.async('text');
    })
    .then((xmlString) => {
      console.log(`Extracted file ${UCD_XML_FILE_NAME}`);
      return new fxp.XMLParser(XML_PARSER_OPTIONS).parse(xmlString);
    });
}

/**
 * Transform UCDChar objects into Character objects
 * @param charAttributesArray An array of UCDChar objects
 * @returns An array of Character objects
 */
function getCharacterNameEntries(charAttributesArray: UCDChar[]): CharacterNameEntry[] {
  return (
    charAttributesArray
      .map((ucdChar) => {
        const attributes = ucdChar.attributes;
        const codepointHex = attributes.cp;
        if (!codepointHex) {
          // private use areas won't have a cp (codepoint), but instead a "first-cp"/"last-cp". we
          // don't want these anyway (they're not really characters?), so lack of this key tells us
          // to skip.
          return;
        }
        const codepoint = parseInt(codepointHex, 16);

        let name = attributes.na;

        // ideographic characters have a format like <prefix>-<codepointHex>, but in this XML
        // document they do not place the <codepointHex>, but instead just a "#", so replace it.
        if (name && name.endsWith('-#')) {
          name = `${name.slice(0, -1)}${codepointHex}`;
        }

        if (!name) {
          // for control characters.
          name = attributes.na1;
        }

        if (!name) {
          // some of the control characters still wont have a name here, so look deeper
          if (!ucdChar['name-alias']) {
            throw new Error(`No name aliases for ${codepointHex}`);
          }

          const aliasesByType: Map<string, UCDCharNameAliasAttributes> = new Map();

          for (const nameAlias of ucdChar['name-alias']) {
            aliasesByType.set(nameAlias.attributes.type, nameAlias.attributes);
          }

          const figment = aliasesByType.get('figment');
          const control = aliasesByType.get('control');

          // first look at the figment, then at the control
          // this is totally arbitrary. im just choosing the types that give the best looking names.
          if (figment) {
            name = figment.alias;
          } else if (control) {
            name = control.alias;
          } else {
            throw new Error(`No acceptable name aliases for ${codepointHex}`);
          }
        }

        // we're definitely deviating from standards here, but i like this kind of data
        if (attributes.kDefinition) {
          name = `${name} (${attributes.kDefinition})`;
        }

        return [codepoint, name] as CharacterNameEntry; // TODO: must we cast?
      })
      // convince typescript that we're not bringing any falsy values by flat-mapping, which always
      // produces an object (an array), but it won't have an element if the item is falsy. this is
      // better than filter(), which typescript has more trouble introspecting.
      // https://stackoverflow.com/a/59726888/235992
      // .filter(i => i) // <-- doesn't work
      .flatMap((i) => (i ? [i] : [])) // does work
  );
}

/**
 * @param namedSequences An Array of named sequences
 * @returns An array of tuples of [codepoints, named sequence name]
 */
function getNamedSequences(namedSequences: UCDNamedSequence[]): [string, string][] {
  return namedSequences
    .map((namedSequence) => namedSequence.attributes)
    .map((namedSequenceAttributes) => [
      String.fromCodePoint(...splitCodepointsString(namedSequenceAttributes.cps)),
      namedSequenceAttributes.name
    ]);
}

/**
 * @param variants An Array of named sequences
 * @returns An array of tuples of [codepoints, standardized variant description]
 */
function getStandardizedVariants(variants: UCDStandardizedVariant[]): [string, string][] {
  return variants
    .map((variant) => variant.attributes)
    .map((variantAttributes) => [
      String.fromCodePoint(...splitCodepointsString(variantAttributes.cps)),
      variantAttributes.desc
    ]);
}

/**
 * Transform UCDChar objects into Character objects
 * @param charAttributesArray An array of UCDChar objects
 * @returns An array of Character objects
 */
function getCombiningSet(charAttributesArray: UCDChar[]): number[] {
  return (
    charAttributesArray
      .map((ucdChar) => {
        const attributes = ucdChar.attributes;
        const codepointHex = attributes.cp;
        if (!codepointHex) {
          // private use areas won't have a cp (codepoint), but instead a "first-cp"/"last-cp". we don't
          // want these anyway (they're not really characters?), so lack of this key tells us to skip.
          return;
        }
        const codepoint = parseInt(codepointHex, 16);

        const isCombining = attributes.ccc !== '0';
        if (isCombining) {
          return codepoint;
        }
        return;
      })
      // convince typescript that we're not bringing any falsy values by flat-mapping, which always
      // produces an object (an array), but it won't have an element if the item is falsy. this is
      // better than filter(), which typescript has more trouble introspecting.
      // https://stackoverflow.com/a/59726888/235992
      // .filter(i => i) // <-- doesn't work
      .flatMap((i) => (i ? [i] : [])) // does work
  );
}

/**
 * Return an array of tuples of [emoji codepoints sequence, emoji name] where there are 2 or more
 * characters in the sequence.
 * @returns A promise of that stuff ^^
 */
async function getEmojiTestSequences(): Promise<[string, string][]> {
  return axios
    .get(EMOJI_TEST_URL, {
      responseType: 'text'
    })
    .then((response: { data: string }) => {
      console.log(`Downloaded ${EMOJI_TEST_URL}`);

      return Array.from(response.data.matchAll(EMOJI_SEQUENCE_PATTERN))
        .map((match) => [match[1], match[4]] as [string, string])
        .map(
          ([codepointSequence, name]) =>
            [String.fromCodePoint(...splitCodepointsString(codepointSequence)), name] as [
              string,
              string
            ]
        )
        .filter((pair) => pair[0].length > 1);
    });
}

// UCD XML stuff
// =============
const ucdXML = await parseUCDXML();

const xmlChars = ucdXML.ucd.repertoire.char;
console.log(`Parsed XML and got ${xmlChars.length} characters`);

// named
const characterEntries = getCharacterNameEntries(xmlChars);
fs.writeFileSync(NAMES_OUTPUT_PATH, JSON.stringify(characterEntries));
console.log(`Wrote character names to ${NAMES_OUTPUT_PATH}`);

// combiners
const combiningSet = getCombiningSet(xmlChars);
fs.writeFileSync(COMBINING_OUTPUT_PATH, JSON.stringify(combiningSet));
console.log(`Wrote combining characters to ${COMBINING_OUTPUT_PATH}`);

// named sequences
const namedSequences = getNamedSequences(ucdXML.ucd['named-sequences']['named-sequence']);
// const namedSequencesTrie = createTrie(namedSequences);
console.log(`Made trie for ${namedSequences.length} named sequences`);
fs.writeFileSync(NAMED_SEQUENCES_OUTPUT_PATH, JSON.stringify(namedSequences));
console.log(`Wrote combining characters to ${NAMED_SEQUENCES_OUTPUT_PATH}`);

// standardized variants
const standardizedVariants = getStandardizedVariants(
  ucdXML.ucd['standardized-variants']['standardized-variant']
);
// const standardizedVariantsTrie = createTrie(standardizedVariants);
console.log(`Made trie for ${standardizedVariants.length} named sequences`);
fs.writeFileSync(STANDARDIZED_VARIANTS_OUTPUT_PATH, JSON.stringify(standardizedVariants));
console.log(`Wrote combining characters to ${STANDARDIZED_VARIANTS_OUTPUT_PATH}`);

// Emoji stuff (sequences of them)
// ===============================
const emojiSequences = await getEmojiTestSequences();
// const emojiSequencesTrie = createTrie(emojiSequences);
console.log(`Made trie for ${emojiSequences.length} emoji sequences`);
fs.writeFileSync(EMOJI_SEQUENCES_OUTPUT_PATH, JSON.stringify(emojiSequences));
console.log(`Wrote combining characters to ${EMOJI_SEQUENCES_OUTPUT_PATH}`);
