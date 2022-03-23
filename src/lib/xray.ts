import { Character } from '../lib/types';
import type { EncodedCharacter } from '../lib/types';

// example chinese
// 您的浏览器属于无痕浏览模式，无法进行正常配置，请您将您的浏览器切换成非无痕浏览模式再进行登录

// example zalgo
// Ë̸͇́x̴̗̾a̴̘͗ḿ̸̨p̸̮̃l̵͙͌ë̸͓́

function* getCombineGroups(text: string, encodedCharMap: Map<number, EncodedCharacter>) {
  let thisGroup: Character[] = [];
  for (const codepoint of Array.from(text.normalize('NFD')).map((s) => s.codePointAt(0))) {
    const char = Character.decode(encodedCharMap.get(codepoint));

    if (char.isCombining) {
      thisGroup.push(char);
    } else {
      if (thisGroup.length) {
        yield thisGroup;
      }
      thisGroup = [];
      thisGroup.push(char);
    }
  }
  if (thisGroup.length) {
    yield thisGroup;
  }
}

/**
 * do some stuff!
 * @param text lol?
 */
export function xRayText(text: string, encodedCharMap: Map<number, EncodedCharacter>) {
  // const a = Array.from(text.normalize('NFD')).map((s) => s.codePointAt(0));
  return [...getCombineGroups(text, encodedCharMap)];
}
