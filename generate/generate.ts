// generate names for unicode characters
// most of the time, the names are the normative names, but other times, i pick and choose stuff
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import axios from 'axios';
import JSZip from 'jszip';
import fxp from 'fast-xml-parser';

// we're running this as an ESM, so we need to shim these in
// https://stackoverflow.com/a/64383997/235992
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const UCD_ZIP_URL = 'https://www.unicode.org/Public/14.0.0/ucdxml/ucd.all.flat.zip';
const UCD_XML_FILE_NAME = 'ucd.all.flat.xml';
const NAMES_OUTPUT_PATH = join(__dirname, '../static/names.json');

// CAREFUL about changing this. some interfaces fields below are coupled to this.
const XML_PARSER_OPTIONS: Partial<fxp.X2jOptions> = {
  ignoreAttributes: false, // we want the attributes fo sho
  attributesGroupName: 'attributes', // put all attributes under a property with this name
  attributeNamePrefix: '' // and don't give the attributes a prefix
};

type UCDXML = {
  ucd: {
    repertoire: {
      char: UCDChar[];
    };
  };
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
function getCharacterNameEntries(charAttributesArray: UCDChar[]): [number, string][] {
  return (
    charAttributesArray
      .map<[number, string] | undefined>((ucdChar) => {
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

        return [codepoint, name];
      })
      // convince typescript that we're not bringing any falsy values by flat-mapping, which always
      // produces an object (an array), but it won't have an element if the item is falsy. this is
      // better than filter(), which typescript has more trouble introspecting.
      // https://stackoverflow.com/a/59726888/235992
      // .filter(c => c) // <-- doesn't work
      .flatMap((c) => (c ? [c] : [])) // <-- does work
  );
}

await parseUCDXML()
  .then((ucdXML) => {
    console.log('Parsed UCD XML');
    return getCharacterNameEntries(ucdXML.ucd.repertoire.char);
  })
  .then((charNameEntries) => {
    fs.writeFileSync(NAMES_OUTPUT_PATH, JSON.stringify(charNameEntries));
    console.log(`Wrote ${charNameEntries.length} character names to ${NAMES_OUTPUT_PATH}`);
  });
