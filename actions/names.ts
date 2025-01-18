"use server";

import { getName, type RangeTrieNode } from "@/lib/trie";
import namesTrie from "./names.json";

export async function lookupNamesAction(
  codepoints: Set<number>
): Promise<Map<number, string>> {
  const names: Map<number, string> = new Map();

  codepoints.forEach((codepoint) => {
    if (codepoint in names) {
      return;
    }

    const name = getName(codepoint, namesTrie as RangeTrieNode[]);
    if (name) {
      names.set(codepoint, name);
    } else {
      throw new Error(`Name not found for codepoint ${codepoint}`);
    }
  });

  return names;
}
