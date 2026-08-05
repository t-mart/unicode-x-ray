<!--
Source text for src/routes/about.tsx. Edit this file, then ask for the port
back to TSX.

Conventions, so nothing is lost in the round trip:

- `## Heading {#id}` gives the heading its anchor.
- A blockquote that starts with **Figure** is a graphic in the page. The
  arrow row is drawn with large type. Edit the caption freely. Tell me if the
  graphic itself must change.
- `{unicodeVersion}` and `{generated}` come from the data manifest at runtime.
- A paragraph marked **Callout** has the boxed style.
- *Term* on first use is a `<dfn>`. "Quoted" text is a `<q>`.

Not in this file: a "Return to home" link sits above the title.
-->

# About

1. [Overview](#overview)
1. [Grapheme Clusters](#grapheme-clusters)
1. [Characters](#characters)
1. [Normalization](#normalization)
1. [Naming](#naming)
1. [Versions](#versions)

## Overview

- Unicode X-Ray is a tool for exploring Unicode text.
- Each [grapheme cluster](#grapheme-clusters) is displayed in a row.
- Each grapheme cluster is broken down into its [characters](#characters) in
  columns.
- The [normalization](#normalization) options let you see how the same grapheme
  cluster can be represented with different characters.

## Grapheme Clusters {#grapheme-clusters}

_Grapheme clusters_ are what we typically think of as individual "characters".
For example, we can break the string _café_ into the following grapheme
clusters:

> **Figure.** café → c + a + f + é
>
> Caption: The string _café_ is made up of grapheme clusters: _c_, _a_, _f_, and
> _é_.

The notion of grapheme clusters is important for the implementation of text
editors and viewers: Text selection, cursor movement, and deletion all operate
on grapheme clusters.

For _café_, grapheme cluster rules would let a text editor know the following:

- The number of "characters" in _café_ is four.
- With a cursor starting at the beginning of the string _café_, pressing the
  right arrow key four times will move the cursor to the end of the string.
- Pressing the backspace key at the end of the string will delete the _é_
  grapheme cluster, leaving _caf_.

Grapheme clusters are described further in
[3.6.2 Grapheme Clusters](https://www.unicode.org/versions/latest/core-spec/chapter-3/#G52443)
and [UAX #29][uax29].

## Characters {#characters}

Grapheme clusters can be further broken down into _characters_, the smallest
components of written language.

In Unicode, characters can be different than the grapheme clusters described
above. This abstraction is useful because it allows characters to be combined:
instead of defining a separate character for every grapheme cluster (such as an
accented letter), we can define constituent characters and combine them.

For example, the grapheme cluster _é_ can be broken into two characters,
providing the following characters in _café_:

> **Figure.** café → c + a + f + e + ◌́
>
> Caption: The string _café_ can be represented as five separate characters.

Text processing systems know how to
[spatially combine](https://www.unicode.org/versions/latest/core-spec/chapter-2/#G4315)
the _e_ and the _◌́_, so that the user sees a single _é_.

(The _é_ is a somewhat poor choice here for illustration because it can also be
represented as a single character under Unicode. However, there are many
instances where the only way to represent a grapheme cluster is with multiple
characters, but they are not familiar to English readers.)

Also worth mentioning: Characters are uniquely identified by
[_code points_](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/#G25564),
numbers in the range 0 to 10FFFF_16. (Though, the inverse is not true:
[not all code points refer to characters](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/#G286941)).
Code points are written in hexadecimal notation, prefixed with "U+".

The code points for _café_ are as follows:

> **Figure.** café → U+0063 + U+0061 + U+0066 + U+0065 + U+0301
>
> Caption: The string _café_ can be represented as five separate code points.

When text is stored in a computer, a
[Unicode encoding](https://www.unicode.org/versions/latest/core-spec/chapter-2/#G13708)
turns each code point into a sequence of bytes.

## Normalization {#normalization}

Above, I mentioned that the _é_ grapheme could be expressed as either a single
code point or as two separate ones, even though they are rendered identically.
These are examples of normalizations: processes to compose or decompose text
into code points in a regular way. This is useful when comparing 2 texts for
identity.

You can read more about this in [Section 3.11 Normalization
Forms][normalization].

There are two axes of normalization, both of which are applied simultaneously:

- _Composition_ (C) vs. _Decomposition_ (D): In general, composition seeks to
  combine characters into a single code point, while decomposition seeks to
  break characters into multiple code points.

  For example, see the codepoints of [_é_ under NFC](/?text=é&norm=NFC) and
  [_é_ under NFD](/?text=é&norm=NFD).

- _Canonical_ (no initial) vs. _Compatibility_ (K): In general, canonical
  normalization seeks to preserve the meaning of the characters. Compatibility
  normalization reduces the characters to a more basic form, which may lose some
  of the original meaning. Compatibility normalization may be useful in
  applications such as search engines, where decorative text may be compared
  against "normal" text.

Control for normalization is offered on Unicode X-Ray because users may be
interested in the different forms that text can take.

## Naming {#naming}

Unicode X-Ray provides a bespoke naming scheme. For each code point, the
following data (produced by the Unicode Consortium) are applied, from lowest
precedence to highest:

1. The name field from [`UnicodeData.txt`][unicodedata]. If the code point
   category is `Cc` (indicating a control character), then the Unicode 1.0 name
   field is used instead.

   This file is, by far, the largest source for code point names in this
   process.

2. The name field from [`DerivedName.txt`][derivedname].

   The names from this file provide more human names to some CJK ideographs and
   also append Jamo (the alphabetic components of Korean Hangul) to their
   respective Hangul characters.

3. Names from [`NameAliases.txt`][namealiases], in this order of preference:
   `correction`, `alternate`, `control`, then `figment`.

   A Unicode name never changes, even when it is wrong, so corrections are
   published here instead. U+2118 is named SCRIPT CAPITAL P, but it is neither a
   P nor a capital: the correction is WEIERSTRASS ELLIPTIC FUNCTION. U+FE18 has
   a typo in its name, BRAKCET. This file also names the C1 control characters,
   including the four that nothing else names: U+0080, U+0081, U+0084, and
   U+0099. Unicode calls three of those names `figment`, meaning labels that
   were never approved in any standard, but a figment beats no name at all.

   Abbreviations such as LF and BOM are also in this file. They are skipped,
   because they are short forms rather than names.

4. `kDefinition` entries from `Unihan_Readings.txt` in [`Unihan.zip`][unihan],
   and `kEH_Desc` entries from [`Unikemet.txt`][unikemet]. A definition does not
   replace the name. It shows below the name, on its own line.

   `kDefinition` entries are provided for many Chinese, Japanese, and Korean
   ideographic characters. This can help non-speakers access the meaning of
   these characters.

   `kEH_Desc` entries describe what an Egyptian hieroglyph depicts. U+13000, for
   example, is named EGYPTIAN HIEROGLYPH A001, which tells you nothing on its
   own. Its description is "Man, seated, right knee raised, right arm raised,
   left arm in front of body."

## Versions {#versions}

Unicode X-Ray gets its grapheme clusters from your browser, and its names from a
data file. That file is built from Unicode {unicodeVersion}, generated on
{generated}.

Your browser may support a newer version of Unicode than the data file. When it
does, a new code point has no name here, and is shown as `<unknown, Block Name>`
instead.

[uax29]: https://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries
[normalization]:
  https://www.unicode.org/versions/latest/core-spec/chapter-3/#G49537
[unicodedata]: https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt
[derivedname]:
  https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt
[namealiases]: https://www.unicode.org/Public/UCD/latest/ucd/NameAliases.txt
[unihan]: https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip
[unikemet]: https://www.unicode.org/Public/UCD/latest/ucd/Unikemet.txt
