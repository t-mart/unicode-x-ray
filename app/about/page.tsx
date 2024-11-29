import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
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
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          About
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          When you type text into this tool, it breaks down what you see into
          two important layers that make up modern digital text:
        </p>
        <Image
          src="/breakdown.png"
          alt="Text has graphemes, graphemes have code points"
          className="w-full mt-10"
          width={404}
          height={265}
        />
        <p className="leading-7 [&:not(:first-child)]:mt-6">
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
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
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
        </p>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          Try typing or pasting some text to see how what appears simple on
          screen can be more complex under the hood. You might be surprised to
          find that emojis, accented characters, and text from different writing
          systems often break down in unexpected ways!
        </p>

        <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Naming
        </h2>
        <p className="leading-7 [&:not(:first-child)]:mt-6">
          This tool chooses names for codepoints in a novel way. All sources are
          official from the Unicode Consortium, but they are combined in a way
          that is not standard but is hopefully more intuitive:
        </p>
        <ol className="my-6 ml-6 list-disc [&>li]:mt-2">
          <li>
            First, names from{" "}
            <code>
              <Link
                href="https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt"
                className="link"
              >
                DerivedName.txt
              </Link>
            </code> are applied
            .
          </li>
          <li>Then, the <code>kDefinition</code> field from </li>
        </ol>
      </article>
    </div>
  );
}
