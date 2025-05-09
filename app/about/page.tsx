import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { H2, P, OList, H3 } from "@/components/typography";

export const metadata: Metadata = {
  title: "Unicode X-Ray - About",
};

function Figure({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <figure>
      <div className="w-fit border p-4 mx-auto select-none">{children}</div>
      <figcaption className="text-center text-sm mt-2">{caption}</figcaption>
    </figure>
  );
}

export default function About() {
  return (
    <div className="max-w-prose mx-auto space-y-4">
      <p>
        <Link href="/" className="link">
          <ArrowLeft className="size-4 inline mr-1" />
          Return to home
        </Link>
      </p>
      <article>
        <H2>About</H2>

        <OList className="">
          <li>
            <a href="#general" className="link">
              General
            </a>
          </li>
          <li>
            <a href="#normalization" className="link">
              Normalization
            </a>
          </li>
          <li>
            <a href="#naming" className="link">
              Naming
            </a>
          </li>
        </OList>

        <H3 id="general">General</H3>

        <P>
          When you type text into this tool, it breaks down what you see into
          two important layers that make up modern digital text:
        </P>

        <Figure
          caption={
            <P className="mb-0">
              The word <em>café</em> is made up of four graphemes: <em>c</em>,{" "}
              <em>a</em>, <em>f</em>, and <em>é</em>.
            </P>
          }
        >
          <div className="flex text-4xl items-center justify-center gap-4">
            <span>café</span>
            <span>→</span>
            <div className="flex items-center justify-center gap-2">
              <span>c</span>
              <span className="text-2xl">+</span>
              <span>a</span>
              <span className="text-2xl">+</span>
              <span>f</span>
              <span className="text-2xl">+</span>
              <span>é</span>
            </div>
          </div>
        </Figure>

        <P>
          <dfn>Graphemes</dfn> are what we typically think of as individual{" "}
          <q>characters</q> &mdash; the visual units that make sense to our
          eyes. For example, in the word <em>café</em>, we see four graphemes.
          But some graphemes are more complex than they appear, such as the{" "}
          <em>é</em> which is actually built from multiple pieces.
        </P>

        <Figure
          caption={
            <P className="mb-0">
              The grapheme <em>é</em> can be represented as either as two
              separate code points or as a single code point.
            </P>
          }
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex text-4xl items-center justify-center gap-4">
              <span>é</span>
              <span>→</span>
              <div className="flex items-center justify-center gap-2">
                <span>e</span>
                <span className="text-2xl">+</span>
                <span>◌́</span>
              </div>
            </div>
            <span>or</span>
            <div className="flex text-4xl items-center justify-center gap-4">
              <span>é</span>
              <span>→</span>
              <div className="flex items-center justify-center gap-2">
                <span>é</span>
              </div>
            </div>
          </div>
        </Figure>

        <P>
          <dfn>Code points</dfn> are the underlying building blocks of text that
          computers use to represent each piece as individual Unicode numbers.
          While a grapheme is what you see, code points are what the computer
          sees. That <em>é</em> we mentioned? It could be stored as either a
          single code point or as two separate ones (an <em>e</em> followed by
          an accent mark) that combine to create what you see.
        </P>
        <P>
          Try typing or pasting some text to see how what appears simple on
          screen can be more complex under the hood. You might be surprised to
          find that emojis, accented characters, and text from different writing
          systems often break down in unexpected ways!
        </P>

        <H3 id="normalization">Normalization</H3>

        <P className="border rounded px-4 py-2 dark:bg-amber-500/25 bg-amber-500/75">
          This is an advanced topic that you can safely ignore! Set the dropdown
          to &quot;None&quot; to apply no normalization.
        </P>

        <P>
          Above, I mentioned that the <em>é</em> grapheme could be expressed as
          either a single code point or as two separate ones, even though the
          graphemes for both are semantically identical. These are examples of
          normalizations: processes to compose or decompose text into code
          points in a regular way. This is useful when comparing 2 texts for
          semantic equivalence.
        </P>

        <P>
          You can read more about this in{" "}
          <Link
            href="https://www.unicode.org/versions/latest/core-spec/chapter-3/#G49537"
            className="link"
          >
            Section 3.11 Normalization Forms of The Unicode Standard
          </Link>
          .
        </P>

        <P>
          I provide control for normalization on this tool because you may be
          interested in the different forms that text can take. Try looking at
          the codepoints produced by looking at <em>é</em> under{" "}
          <Link href="/?text=é&norm=NFC" className="link">
            NFC
          </Link>{" "}
          and{" "}
          <Link href="/?text=é&norm=NFD" className="link">
            NFD
          </Link>{" "}
          forms.
        </P>

        <H3 id="naming">Naming</H3>
        <P>
          This tool compiles code point names in a novel way that I thought was
          most helpful. For each code point, the following data (produced by the
          Unicode Consortium) are applied, from lowest precedence to highest:
        </P>
        <OList>
          <li>
            <P>
              The name field from{" "}
              <code>
                <Link
                  href="https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt"
                  className="link"
                >
                  UnicodeData.txt
                </Link>
              </code>
              . If the code point category is <code>Cc</code> (indicating a
              control character), then the Unicode 1.0 name field is used
              instead.
            </P>
            <P>
              This file is, by far, the largest source for code point names in
              this process.
            </P>
          </li>
          <li>
            <P>
              The name field from{" "}
              <code>
                <Link
                  href="https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt"
                  className="link"
                >
                  DerivedName.txt
                </Link>
              </code>
              .
            </P>
            <P>
              The names from this file provide more human names to some CJK
              ideographs and also append Jamo (the alphabetic components of
              Korean Hangul) to their respective Hangul characters.
            </P>
          </li>
          <li>
            <P>
              <code>kDefinition</code> entries from{" "}
              <code>Unihan_Readings.txt</code> in{" "}
              <code>
                <Link
                  href="https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip"
                  className="link"
                >
                  Unihan.zip
                </Link>
              </code>
              . Instead of replacing the name, the value here is appended to the
              value from the previous steps.
            </P>

            <P>
              <code>kDefinition</code> entries are provided for many Chinese,
              Japanese, and Korean ideographic characters. This can help
              non-speakers access the meaning of these characters.
            </P>
          </li>
        </OList>
      </article>
    </div>
  );
}
