import axios from 'axios';
import JSZip from 'jszip';
import fxp from 'fast-xml-parser';
import fs from 'fs';

const UCD_ZIP_URL = 'https://www.unicode.org/Public/14.0.0/ucdxml/ucd.all.flat.zip';
const UCD_XML_FILE_NAME = 'ucd.all.flat.xml';
const OUTPUT_PATH = './static/codepoints.json';

// CAREFUL about changing this. some interfaces fields below are coupled to this.
const ATTRIBUTE_NAME_PREFIX = 'attr_';

/**
 * A last resort way to get a name. Prefixes should match ATTRIBUTE_NAME_PREFIX.
 */
interface NameAlias {
  attr_alias: string;
  attr_type: string;
}

/**
 * This is the kind of object we get out of the XML. The prefixes of these fields should match
 * ATTRIBUTE_NAME_PREFIX.
 */
interface UCDChar {
  attr_cp?: string;
  attr_na?: string;
  attr_na1?: string;
  attr_kDefinition?: string;
  attr_ccc: string;
  'name-alias'?: NameAlias[];
}

/**
 * The data that unicode x-ray cares about. for space savings, this is an array (not an object that
 * has props). Consumers of this data must know that the elements correspond to:
 *   0: name
 *   1: isCombining
 */
type MyChar = [string, boolean]

/**
 * In memory, HTTP GET the UCD zip, extract the XML file, parse it, and return the characters from
 * it.
 * @returns A promise of an array of UCDChar objects
 */
async function getUnicodeChars(): Promise<UCDChar[]> {
  return axios
    .get(UCD_ZIP_URL, {
      responseType: 'arraybuffer'
    })
    .then((response) => response.data)
    .then((data) => JSZip.loadAsync(data))
    .then((zip) => {
      const file = zip.file(UCD_XML_FILE_NAME);
      if (file === null) {
        throw new Error('cant find that file in the zip archive');
      }
      return file.async('text');
    })
    .then((xmlString) => {
      const xml = new fxp.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: ATTRIBUTE_NAME_PREFIX // how all attribute props will be prefixed
      }).parse(xmlString);

      // just get the tags of type "char". there are others, like "reserved" and "surrogate" that we
      // don't care about (you can't input them into text boxes anyway)
      return xml.ucd.repertoire.char;
    });
}

/**
 * Get a map of codepoints
 * @returns A Map with keys of character codepoints and values of the form `[name, isCombining]`.
 *
 * `name` is a string that names the character in a way that I like. It's definitely not official.
 * `isCombining` is a boolean describing if the character is a combining one or not.
 */
async function generateCodepointsMap(): Promise<Map<number, MyChar>> {
  const chars = await getUnicodeChars();
  const codepoints: Map<number, MyChar> = new Map();

  chars.forEach((char) => {
    const codepointHex = char.attr_cp;
    if (!codepointHex) {
      // private use areas won't have a cp (codepoint), but instead a "first-cp"/"last-cp". we don't
      // want these anyway (they're not really characters?), so lack of this key tells us to skip.
      return;
    }
    const codepoint = parseInt(codepointHex, 16);

    let name = char.attr_na;

    // ideographic characters have a format like <prefix>-<codepointHex>, but in this XML document
    // they do not place the <codepointHex>, but instead just a "#", so replace it.
    if (name && name.endsWith('-#')) {
      name = `${name.slice(0, -1)}${codepointHex}`;
    }

    if (!name) {
      // for control characters.
      name = char.attr_na1;
    }

    if (!name) {
      // some of the control characters still wont have a name here, so look deeper
      if (!char['name-alias']) {
        throw new Error(`No name aliases for ${codepointHex}`);
      }

      const aliasesByType: Map<string, NameAlias> = new Map();

      for (const nameAlias of char['name-alias']) {
        aliasesByType.set(nameAlias.attr_type, nameAlias);
      }

      const figment = aliasesByType.get('figment');
      const control = aliasesByType.get('control');

      // first look at the figment, then at the control
      // this is totally arbitrary. im just choosing the types that give the best looking names.
      if (figment) {
        name = figment.attr_alias;
      } else if (control) {
        name = control.attr_alias;
      } else {
        throw new Error(`No acceptable name aliases for ${codepointHex}`);
      }
    }

    // we're definitely deviating from standards here, but i like this kind of data
    if (char.attr_kDefinition) {
      name = `${name} (${char.attr_kDefinition})`;
    }

    const combining = char.attr_ccc !== '0';

    codepoints.set(codepoint, [name, combining]);
  });

  return codepoints;
}

const map = await generateCodepointsMap();

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(Array.from(map.entries())));
