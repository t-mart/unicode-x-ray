import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import axios from 'axios';
import JSZip from 'jszip';
import fxp from 'fast-xml-parser';

// can't seem to get this to work without the ".js". something in tsconfig?
import { Character } from '../src/lib/types.js';

// we're running this as an ESM, so we need to shim these in
// https://stackoverflow.com/a/64383997/235992
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UCD_ZIP_URL = 'https://www.unicode.org/Public/14.0.0/ucdxml/ucd.all.flat.zip';
const UCD_XML_FILE_NAME = 'ucd.all.flat.xml';
const OUTPUT_PATH = join(__dirname, '../static/characters.json');

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
/**
 * In memory, HTTP GET the UCD zip, extract the XML file, parse it, and return the characters from
 * it.
 * @returns A promise of an array of UCDChar objects
 */
async function getUCDCharsFromXML(): Promise<UCDChar[]> {
  return (
    axios
      .get(UCD_ZIP_URL, {
        responseType: 'arraybuffer'
      })
      .then((response) => {
        console.log(`Downloaded ${UCD_ZIP_URL}`);
        return JSZip.loadAsync(response.data);
      })
      // .then((data) => data))
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
        const xml = new fxp.XMLParser(XML_PARSER_OPTIONS).parse(xmlString);

        // just get the tags of type "char". there are others, like "reserved" and "surrogate" that we
        // don't care about (you can't input them into text boxes anyway)
        return xml.ucd.repertoire.char;
      })
  );
}

/**
 * Transform UCDChar objects into Character objects
 * @param charAttributesArray An array of UCDChar objects
 * @returns An array of Character objects
 */
function getCharacters(charAttributesArray: UCDChar[]): Character[] {
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

        let name = attributes.na;

        // ideographic characters have a format like <prefix>-<codepointHex>, but in this XML document
        // they do not place the <codepointHex>, but instead just a "#", so replace it.
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

        const isCombining = attributes.ccc !== '0';

        // codepoints.set(codepoint, [name, isCombining]);
        return new Character(codepoint, name, isCombining);
      })
      // convince typescript that we're not bringing any falsy values by flat-mapping, which always
      // produces an object (an array), but it won't have an element if the item is falsy. this is
      // better than filter(), which typescript has more trouble introspecting.
      // https://stackoverflow.com/a/59726888/235992
      // .filter(i => i) // <-- doesn't work
      .flatMap((i) => (i ? [i] : [])) // does work
  );
}

const ucdChars = await getUCDCharsFromXML();
console.log('Parsed XML');

const encodedCharacters = getCharacters(ucdChars).map((c) => c.encode());
console.log(`Extracted data ${encodedCharacters.length} <character> elements`);

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(encodedCharacters));
console.log(`Wrote encoded characters to ${OUTPUT_PATH}`);
