export type CharacterData = {
  names: Map<string, string>;
  combining: Set<string>;
  emojiSequences: Map<string, string>;
  namedSequences: Map<string, string>;
  standardizedVariants: Map<string, string>;
};
