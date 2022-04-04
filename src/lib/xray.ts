import { Character } from '../lib/types';
import type { CharacterData } from '../lib/types';

// example chinese
// 您的浏览器属于无痕浏览模式，无法进行正常配置，请您将您的浏览器切换成非无痕浏览模式再进行登录

// example zalgo
// Ë̸͇́x̴̗̾a̴̘͗ḿ̸̨p̸̮̃l̵͙͌ë̸͓́

function* groupCombiningSequences(
  codepoints: number[],
  charData: CharacterData
) {
  let thisGroup: number[] = [];
  for (const codepoint of codepoints) {


    if (charData.combining.has(codepoint)) {
      thisGroup.push(codepoint);
    } else {
      if (thisGroup.length) {
        yield thisGroup;
      }
      thisGroup = [];
      thisGroup.push(codepoint);
    }
  }
  if (thisGroup.length) {
    yield thisGroup;
  }
}

/**
 * "X-rays" some text. That means, to NFD decompose it and group characters that are related.
 * @param text A string to "x-ray"
 * @param encodedCharMap A Map object that maps Unicode codepoints to an EncodedCharacter object
 * @returns An array of subarrays of characters. Each subarray represents a group of Unicode
 * characters that are related, such as a base character and any attached combining characters.
 */
export function xRayText(
  text: string,
  charData: CharacterData,
  normalizationForm?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'
) {
  if (normalizationForm) {
    text = text.normalize(normalizationForm);
  }

  const codepoints = Array.from(text)
    .map((s) => s.codePointAt(0))
    .flatMap((c) => (c ? [c] : [])); // filter out undefined-s

  return groupCombiningSequences(codepoints, charData);
}
