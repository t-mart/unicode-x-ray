// "In the code charts, combining characters are depicted with an associated dotted circle, which
// stands in for the base"
// https://www.unicode.org/versions/Unicode14.0.0/ch02.pdf
const DOTTED_CIRCLE_CODEPOINT = 0x25cc;

// https://unicode.org/reports/tr29/#Regex_Definitions
const COMBINING_CHARACTER_PATTERN = /[\p{M}\p{Join_Control}]/u;

export class Character {
  _str: string | undefined;
  readonly codepoint: number;

  constructor(codepoint: number) {
    this.codepoint = codepoint;
  }

  static fromString(str: string) {
    if (Array.from(str).length !== 1) {
      throw new Error(`String "${str}" has more than 1 codepoint`);
    }
    const codepoint = str.codePointAt(0);
    if (codepoint === undefined) {
      throw new Error(`Could not find codepoint of ${str}`);
    }
    return new Character(codepoint);
  }

  isCombining() {
    return COMBINING_CHARACTER_PATTERN.test(this.toString());
  }

  toString() {
    if (this._str === undefined) {
      this._str = String.fromCodePoint(this.codepoint);
    }
    return this._str;
  }

  toFormattedCodepoint() {
    return 'U+' + this.codepoint.toString(16).toUpperCase().padStart(4, '0');
  }

  toFormattedString() {
    const codepoints = [this.codepoint];

    if (this.isCombining()) {
      codepoints.unshift(DOTTED_CIRCLE_CODEPOINT);
    }

    return String.fromCodePoint(...codepoints);
  }
}
