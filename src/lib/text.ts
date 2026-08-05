/** The offset is the position in the input string. It identifies a duplicate. */
export type Codepoint = {
  readonly value: number;
  readonly string: string;
  readonly offset: number;
};

export type Grapheme = {
  readonly codepoints: readonly Codepoint[];
  readonly string: string;
  readonly offset: number;
};

/**
 * CLDR has no grapheme tailorings outside root, so every locale segments the
 * same way today. The locale is explicit anyway, because a shared link must
 * show the same result to everyone.
 */
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

/**
 * Splits text into extended grapheme clusters (UAX #29), then each cluster into
 * code points. String iteration keeps surrogate pairs whole, so an astral code
 * point stays one entry.
 */
export function segment(text: string): Grapheme[] {
  return [...segmenter.segment(text)].map(({ segment: string, index }) => {
    let offset = index;

    const codepoints = Array.from(string, (character) => {
      const codepoint = {
        value: character.codePointAt(0) ?? 0,
        string: character,
        offset,
      };
      offset += character.length;
      return codepoint;
    });

    return { codepoints, string, offset: index };
  });
}

export function codepointValues(
  graphemes: readonly Grapheme[],
): readonly number[] {
  return graphemes.flatMap((grapheme) =>
    grapheme.codepoints.map((codepoint) => codepoint.value),
  );
}
