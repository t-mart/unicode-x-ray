
import unicode from 'unicode-properties';

const DOTTED_CIRCLE = '◌';

// example chinese
// 您的浏览器属于无痕浏览模式，无法进行正常配置，请您将您的浏览器切换成非无痕浏览模式再进行登录

// example zalgo
// Ë̸͇́x̴̗̾a̴̘͗ḿ̸̨p̸̮̃l̵͙͌ë̸͓́

/**
 * do some stuff!
 * @param text lol?
 */
export function xRayText(text: string) {
    const a = Array.from(text.normalize('NFD')).map((s) => s.codePointAt(0));
    console.log(a);
}