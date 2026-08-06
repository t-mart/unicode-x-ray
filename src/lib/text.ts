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

function isCombiningMark(codepoint: number): boolean {
  // https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/#G1632
  return /^\p{M}/u.test(String.fromCodePoint(codepoint));
}

const DOTTED_CIRCLE = "\u25CC";

/**
 * Add a dotted circle for combining characters to attach to if the codepoint is a
 * combining character. U+25CC is the standard base mark.
 *
 * https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-24/#G8178
 */
export function renderCodepoint(codepoint: number): string {
  const text = String.fromCodePoint(codepoint);
  return isCombiningMark(codepoint) ? DOTTED_CIRCLE + text : text;
}

// TODO: there's also a dashed box convention for characters with no visible display, reserved characters, and non-characters
// https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-24/#G8188
// https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-24/#G8239
// https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-24/#G8246
// The last resort font may work well here? or, find a font that does.
// in general, maybe we should provide fonts for character rendering because users are unlikely
// to be able to render them all. how should we do this efficiently? font at-rules can help with
// character selection. maybe unicode publishes fonts in general for this? all the official charts
// show literally all the characters

// TODO: instead of codepoints as tiles that wrap left-right, look at how this table
// presents things: https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/#G289088
// i like this a lot more. there's less complication with wrapped axes. change to this. (still
// show the code points rendered)
