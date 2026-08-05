import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { manifest } from "../lib/unicode.ts";

export const Route = createFileRoute("/about")({
	component: About,
	head: () => ({
		meta: [{ title: "Unicode X-Ray: About" }],
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
		<figure className="my-8">
			<div className="demo-card mx-auto w-fit select-none">{children}</div>
			<figcaption className="demo-muted mt-2 text-center text-sm">
				{caption}
			</figcaption>
		</figure>
	);
}

function Heading({
	id,
	children,
	level = 2,
}: {
	id: string;
	children: ReactNode;
	level?: 2 | 3;
}) {
	if (level === 3) {
		return (
			<h3 className="demo-section-title mb-2 mt-8 text-lg" id={id}>
				{children}
			</h3>
		);
	}

	return (
		<h2 className="demo-section-title mb-3 mt-10 text-2xl" id={id}>
			{children}
		</h2>
	);
}

function About() {
	return (
		<main className="demo-page max-w-prose">
			<p>
				<Link to="/">Return to home</Link>
			</p>

			<article className="leading-7">
				<h1 className="demo-title display-title mb-6">About</h1>

				<ol className="mb-6 list-decimal space-y-1 pl-5">
					<li>
						<a href="#general">General</a>
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

				<Heading id="general">General</Heading>

				<p>
					When you enter text into this tool, it breaks down into two layers of
					abstraction: <dfn>graphemes</dfn> and <dfn>code points</dfn>.
				</p>

				<Heading id="graphemes" level={3}>
					Graphemes
				</Heading>

				<Figure
					caption={
						<>
							The word <em>café</em> is made up of four graphemes: <em>c</em>,{" "}
							<em>a</em>, <em>f</em>, and <em>é</em>.
						</>
					}
				>
					<div className="flex items-center justify-center gap-4 text-4xl">
						<span>café</span>
						<span>→</span>
						<div className="flex items-center justify-center gap-2">
							<span>c</span>
							<span className="text-2xl">+</span>
							<span>a</span>
							<span className="text-2xl">+</span>
							<span>f</span>
							<span className="text-2xl">+</span>
							<span>é</span>
						</div>
					</div>
				</Figure>

				<p>
					<dfn>Graphemes</dfn> are what we typically think of as individual{" "}
					<q>characters</q>. For example, in the word <em>café</em>, we see four
					graphemes. But some graphemes are more complex than they appear, such
					as the <em>é</em> which is actually built from multiple pieces.
				</p>

				<p className="mt-4">
					A grapheme is a good guess, not a promise. Your browser finds them
					with the rules in{" "}
					<a href="https://www.unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries">
						UAX #29
					</a>
					, and the same rules apply to every language. Sometimes the rules
					disagree with a reader. A Slovak reader calls <em>ch</em> one letter.
					This tool shows two graphemes, because the rules do not know your
					language.
				</p>

				<Heading id="code-points" level={3}>
					Code Points
				</Heading>

				<Figure
					caption={
						<>
							The grapheme <em>é</em> can be represented as either as two
							separate code points or as a single code point.
						</>
					}
				>
					<div className="flex flex-col items-center gap-4">
						<div className="flex items-center justify-center gap-4 text-4xl">
							<span>é</span>
							<span>→</span>
							<div className="flex items-center justify-center gap-2">
								<span>e</span>
								<span className="text-2xl">+</span>
								<span>{"◌́"}</span>
							</div>
						</div>
						<span>or</span>
						<div className="flex items-center justify-center gap-4 text-4xl">
							<span>é</span>
							<span>→</span>
							<span>{"é"}</span>
						</div>
					</div>
				</Figure>

				<p>
					<dfn>Code points</dfn> are the underlying building blocks of text that
					computers use to represent each piece as individual Unicode numbers.
					While a grapheme is what you see, code points are what the computer
					sees. That <em>é</em> we mentioned? It could be stored as either a
					single code point or as two separate ones (an <em>e</em> followed by
					an accent mark) that combine to create what you see.
				</p>

				<p className="mt-4">
					Try typing or pasting some text to see how what appears simple on
					screen can be more complex under the hood. You might be surprised to
					find that emojis, accented characters, and text from different writing
					systems often break down in unexpected ways!
				</p>

				<Heading id="normalization">Normalization</Heading>

				<p className="demo-list-item mb-4">
					This is an advanced topic that you can safely ignore! Set the dropdown
					to "None" to apply no normalization.
				</p>

				<p>
					Above, I mentioned that the <em>é</em> grapheme could be expressed as
					either a single code point or as two separate ones, even though the
					graphemes for both are semantically identical. These are examples of
					normalizations: processes to compose or decompose text into code
					points in a regular way. This is useful when comparing 2 texts for
					semantic equivalence.
				</p>

				<p className="mt-4">
					You can read more about this in{" "}
					<a href="https://www.unicode.org/versions/latest/core-spec/chapter-3/#G49537">
						Section 3.11 Normalization Forms of The Unicode Standard
					</a>
					.
				</p>

				<p className="mt-4">
					I provide control for normalization on this tool because you may be
					interested in the different forms that text can take. Try looking at
					the codepoints produced by looking at <em>é</em> under{" "}
					<Link to="/" search={{ text: "é", norm: "NFC" }}>
						NFC
					</Link>{" "}
					and{" "}
					<Link to="/" search={{ text: "é", norm: "NFD" }}>
						NFD
					</Link>{" "}
					forms.
				</p>

				<p className="mt-4">
					The K forms go one step further. They replace a character with a plain
					equivalent. Try{" "}
					<Link to="/" search={{ text: "𝓑𝓮𝓪𝓾𝓽𝓲𝓯𝓾𝓵", norm: "NFKD" }}>
						𝓑𝓮𝓪𝓾𝓽𝓲𝓯𝓾𝓵 under NFKD
					</Link>
					. The result is the word <em>Beautiful</em>. This is why decorative
					text often fails a search.
				</p>

				<Heading id="naming">Naming</Heading>

				<p>
					This tool compiles code point names in a novel way that I thought was
					most helpful. For each code point, the following data (produced by the
					Unicode Consortium) are applied, from lowest precedence to highest:
				</p>

				<ol className="mt-4 list-decimal space-y-4 pl-5">
					<li>
						<p>
							The name field from{" "}
							<a href="https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt">
								<code>UnicodeData.txt</code>
							</a>
							. If the code point category is <code>Cc</code> (indicating a
							control character), then the Unicode 1.0 name field is used
							instead.
						</p>
						<p className="mt-2">
							This file is, by far, the largest source for code point names in
							this process.
						</p>
					</li>
					<li>
						<p>
							The name field from{" "}
							<a href="https://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedName.txt">
								<code>DerivedName.txt</code>
							</a>
							.
						</p>
						<p className="mt-2">
							The names from this file provide more human names to some CJK
							ideographs and also append Jamo (the alphabetic components of
							Korean Hangul) to their respective Hangul characters.
						</p>
					</li>
					<li>
						<p>
							<code>kDefinition</code> entries from{" "}
							<code>Unihan_Readings.txt</code> in{" "}
							<a href="https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip">
								<code>Unihan.zip</code>
							</a>
							. The definition does not replace the name. It shows below the
							name, on its own line.
						</p>
						<p className="mt-2">
							<code>kDefinition</code> entries are provided for many Chinese,
							Japanese, and Korean ideographic characters. This can help
							non-speakers access the meaning of these characters.
						</p>
					</li>
				</ol>

				<p className="mt-4">
					Four control characters have no name in these files: U+0080, U+0081,
					U+0084, and U+0099. They show the name of their block instead.
				</p>

				<Heading id="versions">Versions</Heading>

				<p>
					Two different sources supply this page. Your browser splits the text
					into graphemes. A data file supplies the names. This page uses Unicode{" "}
					{manifest.unicodeVersion}, generated on {manifest.generated}.
				</p>

				<p className="mt-4">
					Your browser can support a different version of Unicode. Unicode adds
					code points in each release. If your browser is newer than the data
					file, a new code point shows <code>{"<unknown, Block Name>"}</code>.
					The block name tells you that the data file is behind, and not that
					the code point is empty.
				</p>
			</article>
		</main>
	);
}
