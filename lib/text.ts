export type Codepoint = {
  value: number;
  string: string;
}

export type Grapheme = {
  codePoints: Codepoint[];
  string: string;
};

export type Text = {
  graphemes: Grapheme[];
  string: string;
};


export function parse(text: string, segmenter: Intl.Segmenter): Text {
  const graphemes: Grapheme[] = [];
  const string = text;
  for (const { segment } of segmenter.segment(text)) {
    const codePoints: Codepoint[] = [];
    for (const codePoint of segment) {
      codePoints.push({
        value: codePoint.codePointAt(0)!,
        string: codePoint,
      });
    }
    graphemes.push({ codePoints, string: segment });
  }
  return { graphemes, string };
}