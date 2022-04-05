import type { CharacterData } from '../lib/types';
import split from 'graphemesplit';

// example chinese
// 您的浏览器属于无痕浏览模式，无法进行正常配置，请您将您的浏览器切换成非无痕浏览模式再进行登录

// example zalgo
// Ë̸͇́x̴̗̾a̴̘͗ḿ̸̨p̸̮̃l̵͙͌ë̸͓́

// "In the code charts, combining characters are depicted with an associated dotted circle, which
// stands in for the base"
// https://www.unicode.org/versions/Unicode14.0.0/ch02.pdf
const DOTTED_CIRCLE_CODEPOINT = 0x25cc;

export class Codepoint {
  readonly value: string;
  readonly name: string;
  readonly isCombining: boolean;

  constructor(value: string, name: string, isCombining: boolean) {
    this.value = value;
    this.name = name;
    this.isCombining = isCombining;
  }

  static fromCharacterData(value: string, charData: CharacterData) {
    const name = charData.names.get(value);
    if (name === undefined) {
      throw new Error(`${value} (${value.codePointAt(0)}) doesn't have a name we know about`);
    }
    const isCombining = charData.combining.has(value);
    return new Codepoint(value, name, isCombining);
  }

  codepoint() {
    const codepoint = this.value.codePointAt(0);
    if (codepoint === undefined) {
      throw new Error();
    }
    return codepoint;
  }

  codepointFormatted() {
    return 'U+' + this.codepoint().toString(16).toUpperCase().padStart(4, '0');
  }

  toString() {
    const codepoints = [this.codepoint()];

    if (this.isCombining) {
      codepoints.unshift(DOTTED_CIRCLE_CODEPOINT);
    }

    return String.fromCodePoint(...codepoints);
  }
}

/**
 * "X-rays" some text.
 * @param text A string to "x-ray"
 * @returns An array of subarrays of characters. Each subarray represents a group of Unicode
 * characters that are related, such as a base character and any attached combining characters.
 */
export function graphemeSplit(
  text: string,
  charData: CharacterData,
  normalizationForm?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'
): Codepoint[][] {
  if (normalizationForm) {
    text = text.normalize(normalizationForm);
  }

  return split(text).map((grapheme) =>
    Array.from(grapheme).map((codepoint) => Codepoint.fromCharacterData(codepoint, charData))
  );
}
