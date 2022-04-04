import type {EncodedTrie} from './trie';

// "In the code charts, combining characters are depicted with an associated dotted circle, which
// stands in for the base"
// https://www.unicode.org/versions/Unicode14.0.0/ch02.pdf
const DOTTED_CIRCLE_CODEPOINT = 0x25cc;

/**
 * A character with various properties given by the Unicode standard.
 */
export class Character {
  codepoint: number;
  name: string;

  constructor(codepoint: number, name: string) {
    this.codepoint = codepoint;
    this.name = name;
  }

  // codepointFormatted() {
  //   return 'U+' + this.codepoint.toString(16).toUpperCase().padStart(4, '0');
  // }

  toString() {
    const codepoints = [this.codepoint];

    return String.fromCodePoint(...codepoints);
  }

  encode(): CharacterNameEntry {
    return [this.codepoint, this.name];
  }

  static decode(encodedCharacter: CharacterNameEntry): Character {
    const [codepoint, name] = encodedCharacter;

    // const isCombining = ((attributeBitfield >> 0) & 1) === 1;
    // const another = ((attributeBitfield >> 1) & 1) === 1;
    // const yetAnother = ((attributeBitfield >> 2) & 1) === 1;
    // ...

    return new Character(codepoint, name);
  }
}

/**
 * A character -- encoded to a more primitive representation for interchange.
 * For space savings, the character is encoded into an array and the boolean attributes are encoded
 * into a bitfield.
 * (In constrast, an object would be more ergonomic, but would incur a significant storage cost when
 * encoded into JSON).
 */
export type CharacterNameEntry = [
  number, // the codepoint
  string // the name
  // number // bitfield of boolean attributes
];

export type CharacterData = {
  names: Map<number, string>;
  combining: Set<number>;
  emojiSequences: EncodedTrie;
  namedSequences: EncodedTrie;
  standardizedVariants: EncodedTrie;
};
