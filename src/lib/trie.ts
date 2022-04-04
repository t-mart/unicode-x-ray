
export class Trie {
  codepoints: Map<number, Trie>;
  value: string | undefined;

  constructor(codepoints: Map<number, Trie>, value: string | undefined) {
    this.codepoints = codepoints;
    this.value = value;
  }

  static fromJSON(encTrie: string): Trie {
    const decoded = JSON.parse(encTrie);
    if (decoded.)
  }

  toJSON() {
    return {

    }
  }
}

/**
 * @param needle an iterable of codepoint numbers to lookup
 * @param haystack the trie in which to look
 * @returns the value of needle in the trie, or undefined if it is not in the trie
 */
export function searchTrie(needle: Iterable<number>, haystack: EncodedTrie) {
  let cur = haystack;
  for (const codepoint of needle) {
    if (!cur[codepoint]) {
      return undefined;
    }
    cur = cur[codepoint] as EncodedTrie;
  }
  return cur.v; // will correctly return undefined if cur is not a terminating node
}

/**
 * @param sequences An Iterable of [Iterable<number>, string] where the 0th element is a sequence
 * of codepoints and the string is some value for them.
 * @returns A trie object.
 */
export function createTrie(sequences: Iterable<[Iterable<number>, string]>) {
  const trie: EncodedTrie = {};
  for (const sequenceAndValue of sequences) {
    const sequence = sequenceAndValue[0];
    const value = sequenceAndValue[1];
    let cur = trie;
    for (const codepoint of sequence) {
      if (cur[codepoint] === undefined) {
        cur[codepoint] = {};
      }
      cur = cur[codepoint] as EncodedTrie;
    }
    cur.v = value;
  }
  return trie;
}

export function mapTrie(trie: EncodedTrie): Map<Iterable[], string> {
  const map: Map<Iterable<number>, string> = new Map();

  const stack = [...trie];

  while (stack.length > 0) {
    if (stack.at(-1)?.v) {
      map.set([...stack.map], v);
    }
  }
}
