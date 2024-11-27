export type RangeTrieNode = [
  number, // the codepoint
  (
    | string // the name
    | [
        // or
        number, // the size of the range
        string // the name for all codepoints in the range
      ]
  )
];

export function rangeTrieify(names: Map<string, string>): RangeTrieNode[] {
  const trie: RangeTrieNode[] = [];
  const [minCodepoint, maxCodepoint] = names
    .keys()
    .reduce(
      ([min, max], code) => [
        Math.min(min, parseInt(code, 16)),
        Math.max(max, parseInt(code, 16)),
      ],
      [Infinity, -Infinity]
    );

  for (let codepoint = minCodepoint; codepoint <= maxCodepoint; codepoint++) {
    const codepointString = codepoint
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    const name = names.get(codepointString);

    if (!name) {
      continue;
    }

    if (trie.length === 0) {
      trie.push([codepoint, name]);
      continue;
    }

    const [lastCodepoint, lastValue] = trie[trie.length - 1];
    const lastRangeEnd = Array.isArray(lastValue)
      ? lastCodepoint + lastValue[0] - 1
      : lastCodepoint;

    if (codepoint === lastRangeEnd + 1) {
      const lastName = Array.isArray(lastValue) ? lastValue[1] : lastValue;

      if (name === lastName) {
        if (Array.isArray(lastValue)) {
          lastValue[0]++;
        } else {
          trie[trie.length - 1] = [lastCodepoint, [2, name]];
        }
        continue;
      }
    }

    trie.push([codepoint, name]);
  }

  return trie;
}

export function getName(
  codepoint: number,
  trie: RangeTrieNode[]
): string | null {
  let start = 0;
  let end = trie.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const [midCodepoint, midValue] = trie[mid];

    if (midCodepoint === codepoint) {
      return Array.isArray(midValue) ? midValue[1] : midValue;
    }

    if (midCodepoint < codepoint) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  if (end < 0) {
    return null;
  }

  const [foundCodepoint, foundValue] = trie[end];
  const rangeEnd = Array.isArray(foundValue)
    ? foundCodepoint + foundValue[0] - 1
    : foundCodepoint;

  if (codepoint <= rangeEnd) {
    if (Array.isArray(foundValue)) {
      return foundValue[1];
    } else {
      return foundValue;
    }
  }

  return null;
}
