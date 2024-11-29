import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { H2, P, OList, H3 } from "@/components/typography";

export const metadata: Metadata = {
  // TODO: can we use the parent layout's title?
  title: "Unicode X-Ray - About",
};

export default function About() {
  return (
    <div className="max-w-prose mx-auto space-y-4">
      <p>
        <Link href="/" className="link">
          <ArrowLeft className="size-4 inline mr-1" />
          Return to home
        </Link>
      </p>
      <article className="">
        <H2>About</H2>
        <P>
          When you type text into this tool, it breaks down what you see into
          two important layers that make up modern digital text:
        </P>
        <Image
          src="/breakdown.png"
          alt="Text has graphemes, graphemes have code points"
          className="w-full mt-10"
          width={404}
          height={265}
        />
        <P>
          <dfn>Graphemes</dfn> are what we typically think of as individual{" "}
          <q>characters</q> &mdash; the visual units that make sense to our
          eyes. For example, in the word{" "}
          <q>
            <em>café</em>
          </q>
          , we see four graphemes. But some graphemes are more complex than they
          appear, such as the
          <q>
            <em>é</em>
          </q>{" "}
          which is actually built from multiple pieces.
        </P>
        <P>
          <dfn>Code points</dfn> are the underlying building blocks of text that
          computers use to represent each piece as individual Unicode numbers.
          While a grapheme is what you see, code points are what the computer
          sees. That{" "}
          <q>
            <em>é</em>
          </q>{" "}
          we mentioned? It could be stored as either a single code point or as
          two separate ones (an{" "}
          <q>
            <em>e</em>
          </q>
          followed by an accent mark) that combine to create what you see.
        </P>
        <P>
          Try typing or pasting some text to see how what appears simple on
          screen can be more complex under the hood. You might be surprised to
          find that emojis, accented characters, and text from different writing
          systems often break down in unexpected ways!
        </P>

        <H3>Naming</H3>
        <P>
          This tool compiles codepoints names in a novel way that feels helpful
          to me. For each codepoint, the following data (produced by the Unicode
          Consortium) are applied, from lowest precedence to highest:
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
              . If the codepoint category is <code>Cc</code> (indicating a
              control character), then the Unicode 1.0 name field is used
              instead.
            </P>
            <P>
              This file is, by far, the largest source for codepoint names in
              this process.
            </P>
          </li>
          <li>
            <P>
              The comment field from{" "}
              <code>
                <Link
                  href="https://www.unicode.org/Public/UCD/latest/ucd/Jamo.txt"
                  className="link"
                >
                  Jamo.txt
                </Link>
              </code>
              . This field is probably non-standard, but it&apos;s the most
              helpful.
            </P>
            <P>Jamo are the alphabetic components of Korean Hangul.</P>
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
              Japanese, and Korean ideographic characters.
            </P>
          </li>
        </OList>
      </article>
    </div>
  );
}
