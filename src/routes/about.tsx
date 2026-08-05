import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { pageMeta } from "../lib/meta.ts";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: pageMeta({
      title: "Unicode X-Ray: About",
      description:
        "How grapheme clusters, code points, normalization, and character names work.",
      path: "/about",
    }),
  }),
});

function Figure({
  children,
  caption,
}: {
  children: ReactNode;
  caption: ReactNode;
}) {
  return (
    <figure>
      <p>{children}</p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function About() {
  return (
    <main>
      <article>
        <h1>About</h1>

        <nav aria-label="Contents">
          <ol>
            <li>
              <a href="#overview">Overview</a>
            </li>
            <li>
              <a href="#grapheme-clusters">Grapheme Clusters</a>
            </li>
            <li>
              <a href="#characters">Characters</a>
            </li>
            <li>
              <a href="#normalization">Normalization</a>
            </li>
            <li>
              <a href="#naming">Naming</a>
            </li>
            <li>
              <a href="#versions">Versions</a>
            </li>
          </ol>
        </nav>

        <section aria-labelledby="overview">
          <h2 id="overview">Overview</h2>

          <ul>
            <li>Unicode X-Ray is a tool for exploring Unicode text.</li>
            <li>
              Each <a href="#grapheme-clusters">grapheme cluster</a> is
              displayed in a row.
            </li>
            <li>
              Each grapheme cluster is broken down into its{" "}
              <a href="#characters">characters</a> in columns.
            </li>
            <li>
              The <a href="#normalization">normalization</a> options let you see
              how the same grapheme cluster can be represented with different
              characters.
            </li>
          </ul>
        </section>

        <section aria-labelledby="grapheme-clusters">
          <h2 id="grapheme-clusters">Grapheme Clusters</h2>

          <p>
            <dfn>Grapheme clusters</dfn> are what we typically think of as
            individual <q>characters</q>. For example, we can break the string{" "}
            <em>café</em> into the following grapheme clusters:
          </p>

          <Figure
            caption={
              <>
                The string <em>café</em> is made up of grapheme clusters:{" "}
                <em>c</em>, <em>a</em>, <em>f</em>, and <em>é</em>.
              </>
            }
          >
            café → c + a + f + é
          </Figure>

          <p>
            The notion of grapheme clusters is important for the implementation
            of text editors and viewers: Text selection, cursor movement, and
            deletion all operate on grapheme clusters.
          </p>

          <p>
            For <em>café</em>, grapheme cluster rules would let a text editor
            know the following:
          </p>

          <ul>
            <li>
              The number of <q>characters</q> in <em>café</em> is four.
            </li>
            <li>
              With a cursor starting at the beginning of the string{" "}
              <em>café</em>, pressing the <kbd>right arrow</kbd> key four times
              will move the cursor to the end of the string.
            </li>
            <li>
              Pressing the <kbd>backspace</kbd> key at the end of the string
              will delete the <em>é</em> grapheme cluster, leaving <em>caf</em>.
            </li>
          </ul>

          <p>
            Grapheme clusters are described further in{" "}
            <a href="https://www.unicode.org/versions/latest/core-spec/chapter-3/#G52443">
              3.6.2 Grapheme Clusters
            </a>{" "}
            and{" "}
            <a href="https://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries">
              UAX #29
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="characters">
          <h2 id="characters">Characters</h2>

          <p>
            Grapheme clusters can be further broken down into{" "}
            <dfn>characters</dfn>, the smallest components of written language.
          </p>

          <p>
            In Unicode, characters can be different than the grapheme clusters
            described above. This abstraction is useful because it allows
            characters to be combined: instead of defining a separate character
            for every grapheme cluster (such as an accented letter), we can
            define constituent characters and combine them.
          </p>

          <p>
            For example, the grapheme cluster <em>é</em> can be broken into two
            characters, providing the following characters in <em>café</em>:
          </p>

          <Figure
            caption={
              <>
                The string <em>café</em> can be represented as five separate
                characters.
              </>
            }
          >
            {"café → c + a + f + e + ◌́"}
          </Figure>

          <p>
            Text processing systems know how to{" "}
            <a href="https://www.unicode.org/versions/latest/core-spec/chapter-2/#G4315">
              spatially combine
            </a>{" "}
            the <em>e</em> and the <em>{"◌́"}</em>, so that the user sees a
            single <em>é</em>.
          </p>

          <p>
            (The <em>é</em> is a somewhat poor choice here for illustration
            because it can also be represented as a single character under
            Unicode. However, there are many instances where the only way to
            represent a grapheme cluster is with multiple characters, but they
            are not familiar to English readers.)
          </p>

          <p>
            Also worth mentioning: Characters are uniquely identified by{" "}
            <dfn>
              <a href="https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/#G25564">
                code points
              </a>
            </dfn>
            , numbers in the range 0 to 10FFFF<sub>16</sub>. Code points are
            written in hexadecimal notation, prefixed with <q>U+</q>.
          </p>

          <p>
            The code points for <em>café</em> are as follows:
          </p>

          <Figure
            caption={
              <>
                The string <em>café</em> can be represented as five separate
                code points.
              </>
            }
          >
            café → U+0063 + U+0061 + U+0066 + U+0065 + U+0301
          </Figure>

          <p>
            When text is stored in a computer, a{" "}
            <a href="https://www.unicode.org/versions/latest/core-spec/chapter-2/#G13708">
              Unicode encoding
            </a>{" "}
            turns each code point into a sequence of bytes.
          </p>
        </section>

        <section aria-labelledby="normalization">
          <h2 id="normalization">Normalization</h2>

          <p>
            Above, it was noted that the <em>é</em> grapheme could be
            equivalently represented as either a single character or as two
            separate ones. But, with two encodings, processors would be unable
            to tell they are the same. This creates the need for normalization:
            a regular way of picking the encoding.
          </p>

          <p>
            There are two axes of normalization, both of which are applied
            simultaneously:
          </p>

          <table>
            <caption>The four normalization forms</caption>
            <thead>
              <tr>
                <th scope="col">Form</th>
                <th scope="col">Composition</th>
                <th scope="col">Decomposition</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Canonical</th>
                <td>NFC</td>
                <td>NFD</td>
              </tr>
              <tr>
                <th scope="row">Compatibility</th>
                <td>NFKC</td>
                <td>NFKD</td>
              </tr>
            </tbody>
          </table>

          <dl>
            <dt>
              <em>Composition</em> (C) vs. <em>Decomposition</em> (D)
            </dt>
            <dd>
              <p>
                In general, composition seeks to combine characters into a
                single code point, while decomposition seeks to break characters
                into multiple code points.
              </p>
              <p>
                For example, see the codepoints of{" "}
                <Link to="/" search={{ text: "é", norm: "NFC" }}>
                  <em>é</em> under NFC
                </Link>{" "}
                and{" "}
                <Link to="/" search={{ text: "é", norm: "NFD" }}>
                  <em>é</em> under NFD
                </Link>
                .
              </p>
            </dd>

            <dt>
              <em>Canonical</em> (no initial) vs. <em>Compatibility</em> (K)
            </dt>
            <dd>
              <p>
                In general, canonical normalization seeks to preserve the
                meaning of the characters, while compatibility normalization
                reduces the characters to a more basic form, which may lose some
                of the original meaning.
              </p>
              <p>
                For example, see the codepoints of{" "}
                <Link to="/" search={{ text: "ℝ", norm: "NFD" }}>
                  <em>ℝ</em> under NFD
                </Link>{" "}
                and{" "}
                <Link to="/" search={{ text: "ℝ", norm: "NFKD" }}>
                  <em>ℝ</em> under NFKD
                </Link>
                .
              </p>
            </dd>
          </dl>

          <p>
            A few characters change under every form. For one example, open{" "}
            <Link to="/" search={{ text: "ẛ" }}>
              <em>ẛ</em>
            </Link>{" "}
            and step through the normalization menu.
          </p>

          <p>
            Read more about normalization in{" "}
            <a href="https://www.unicode.org/versions/latest/core-spec/chapter-3/#G49537">
              Section 3.11 Normalization Forms
            </a>
            .
          </p>

          <p>
            Control for normalization is offered on Unicode X-Ray because users
            may be interested in the different representations that text can
            take.
          </p>
        </section>

        <section aria-labelledby="naming">
          <h2 id="naming">Naming</h2>

          <p>
            Unicode X-Ray gives each assigned code point a useful name when the
            Unicode Character Database provides enough information. It combines
            several official files and gives some sources priority over others.
          </p>

          <ol>
            <li>
              <p>
                <strong>Start with the published name.</strong>{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt">
                  <code>DerivedName.txt</code>
                </a>{" "}
                supplies the name for almost every assigned code point. For most
                code points, this name is the final result.
              </p>
            </li>

            <li>
              <p>
                <strong>Label code points without individual names.</strong>{" "}
                Surrogates and private-use code points do not have individual
                Unicode names.{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt">
                  <code>UnicodeData.txt</code>
                </a>{" "}
                identifies these ranges, and{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt">
                  <code>Blocks.txt</code>
                </a>{" "}
                supplies each block name.
              </p>
              <p>Unicode X-Ray uses the block name as a useful label.</p>
            </li>

            <li>
              <p>
                <strong>Add control names.</strong>{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt">
                  <code>UnicodeData.txt</code>
                </a>{" "}
                records the Unicode 1.0 name for many control code points. The
                generator uses this name when no selected alias exists.
              </p>
            </li>

            <li>
              <p>
                <strong>Apply selected aliases.</strong> Unicode keeps each
                published character name stable, even if the name contains an
                error.{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/NameAliases.txt">
                  <code>NameAliases.txt</code>
                </a>{" "}
                publishes corrections and other aliases separately.
              </p>
              <p>
                Unicode X-Ray prefers corrections, then alternate names, control
                names, and finally figments. It does not use abbreviations as
                character names.
              </p>
              <p>
                The selected alias replaces the published name or the Unicode
                1.0 control name.
              </p>
            </li>

            <li>
              <p>
                <strong>Add a definition when one exists.</strong> Some names
                identify an ideograph by code point or a hieroglyph by catalog
                number. These names identify the character, but they do not
                explain it.
              </p>
              <p>
                <code>kDefinition</code> in <code>Unihan_Readings.txt</code>{" "}
                from{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip">
                  <code>Unihan.zip</code>
                </a>{" "}
                supplies glosses for Chinese, Japanese, and Korean ideographs.{" "}
                <code>kEH_Desc</code> in{" "}
                <a href="https://www.unicode.org/Public/UCD/latest/ucd/Unikemet.txt">
                  <code>Unikemet.txt</code>
                </a>{" "}
                describes Egyptian hieroglyphs.
              </p>
              <p>Unicode X-Ray shows a definition below the name.</p>
            </li>
          </ol>
        </section>

        <section aria-labelledby="versions">
          <h2 id="versions">Versions</h2>

          <p>
            Your browser may use a different version of Unicode than Unicode
            X-Ray, and therefore, Unicode X-Ray may not be able to provide a
            name for every character you provide.
          </p>

          <p>
            In the case that you have entered a code point not yet in the
            Unicode version used by Unicode X-Ray, its name will be{" "}
            <code>{"<unknown, Block Name>"}</code>.
          </p>
        </section>
      </article>
    </main>
  );
}
