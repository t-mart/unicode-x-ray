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

const DOTTED_CIRCLE = "◌";

/**
 * A combining mark shown on its own has nothing to attach to, so it lands on
 * whatever precedes it or floats loose. U+25CC is the base the standard uses to
 * display a mark in isolation.
 *
 * Brahmic shapers already insert one for a cluster with no base, but the
 * default shaper does not, so a Devanagari vowel sign got a circle and a
 * combining acute did not. Supplying the base makes every script agree. The
 * property escape reads the engine's own tables, which are the tables that
 * decide how the character renders.
 */
export function withBase(text: string): string {
  return /^\p{M}/u.test(text) ? DOTTED_CIRCLE + text : text;
}
