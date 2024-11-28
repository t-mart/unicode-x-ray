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
      <article className="space-y-4">
        <p>
          When you type text into this tool, it breaks down what you see into
          two important layers that make up modern digital text:
        </p>
        <Image
          src="/breakdown.png"
          alt="Text has graphemes, graphemes have code points"
          className="w-full"
          width={404}
          height={265}
        />
        <p>
          <dfn>Graphemes</dfn> are what we typically think of as individual{" "}
          <q>characters</q> &mdash; the visual units that make sense to our eyes. For
          example, in the word{" "}
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
        <p>
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
        <p>
          Try typing or pasting some text to see how what appears simple on
          screen can be more complex under the hood. You might be surprised to
          find that emojis, accented characters, and text from different writing
          systems often break down in unexpected ways!
        </p>
      </article>
    </div>
  );
}
