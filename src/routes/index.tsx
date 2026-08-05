import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { type Example, examples, pickExamples } from "../lib/examples.ts";
import { codepointValues, type Grapheme, segment } from "../lib/text.ts";
import { manifest } from "../lib/unicode.ts";
import { type CodepointInfo, useCodepointInfo } from "../lib/unicode-query.ts";

const normalizations = ["NFC", "NFD", "NFKC", "NFKD"] as const;
type Normalization = (typeof normalizations)[number];

type Search = { text?: string; norm?: Normalization };

/**
 * The URL is the only state. Nothing copies it into a component, so a shared
 * link and a typed character take the same path.
 */
function buildSearch(text: string, norm: Normalization | undefined): Search {
	if (!text) {
		return {};
	}

	return norm ? { text, norm } : { text };
}

export const Route = createFileRoute("/")({
	component: XRay,
	validateSearch: (search: Record<string, unknown>): Search => {
		const text = typeof search.text === "string" ? search.text : "";
		const norm = normalizations.find((value) => value === search.norm);
		return buildSearch(text, norm);
	},
	head: () => ({
		meta: [
			{ title: "Unicode X-Ray" },
			{
				name: "description",
				content:
					"Split text into graphemes and code points, and name every one.",
			},
		],
	}),
});

function formatCodepoint(codepoint: number): string {
	return codepoint.toString(16).toUpperCase().padStart(4, "0");
}

function XRay() {
	const { text = "", norm } = Route.useSearch();
	const navigate = Route.useNavigate();

	const update = (nextText: string, nextNorm: Normalization | undefined) => {
		void navigate({ search: buildSearch(nextText, nextNorm), replace: true });
	};

	const graphemes = useMemo(
		() => segment(norm ? text.normalize(norm) : text),
		[text, norm],
	);
	const codepoints = useMemo(
		() => [...new Set(codepointValues(graphemes))],
		[graphemes],
	);
	const info = useCodepointInfo(codepoints);
	const byCodepoint = new Map(info.map((entry) => [entry.codepoint, entry]));

	return (
		<main>
			<h1>Unicode X-Ray</h1>
			<p>
				Paste text. See the graphemes your reader sees, the code points behind
				them, and the name of every one.
			</p>

			<Form text={text} norm={norm} update={update} />

			{graphemes.length > 0 ? (
				<Graphemes graphemes={graphemes} byCodepoint={byCodepoint} />
			) : (
				<Examples onPick={(picked) => update(picked, norm)} />
			)}

			<p>
				Names come from Unicode {manifest.unicodeVersion}, generated{" "}
				{manifest.generated}. Segmentation comes from your browser, which may
				know a different version. <Link to="/about">More about that.</Link>
			</p>
		</main>
	);
}

function Form({
	text,
	norm,
	update,
}: {
	text: string;
	norm: Normalization | undefined;
	update: (text: string, norm: Normalization | undefined) => void;
}) {
	const [copied, setCopied] = useState(false);

	async function copyLink() {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<div>
			<div>
				<label htmlFor="text">Text</label>{" "}
				<input
					id="text"
					value={text}
					placeholder="Put your text here"
					// biome-ignore lint/a11y/noAutofocus: the input is the whole point of the page
					autoFocus
					onChange={(event) => update(event.target.value, norm)}
				/>
			</div>

			<div>
				<label htmlFor="norm">Normalization</label>{" "}
				<select
					id="norm"
					value={norm ?? ""}
					onChange={(event) =>
						update(
							text,
							normalizations.find((value) => value === event.target.value),
						)
					}
				>
					<option value="">None</option>
					{normalizations.map((value) => (
						<option key={value} value={value}>
							{value}
						</option>
					))}
				</select>
			</div>

			{text.length > 0 && (
				<div>
					<button type="button" onClick={() => update("", norm)}>
						Clear
					</button>{" "}
					<button type="button" onClick={copyLink}>
						{copied ? "Link copied" : "Copy link"}
					</button>
				</div>
			)}
		</div>
	);
}

function Graphemes({
	graphemes,
	byCodepoint,
}: {
	graphemes: readonly Grapheme[];
	byCodepoint: ReadonlyMap<number, CodepointInfo>;
}) {
	return (
		<section>
			<h2>
				{graphemes.length} grapheme{graphemes.length === 1 ? "" : "s"}
			</h2>
			<ol>
				{graphemes.map((grapheme) => (
					<li key={grapheme.offset}>
						<p>{grapheme.string}</p>
						<ol>
							{grapheme.codepoints.map((codepoint) => (
								<CodepointCard
									key={codepoint.offset}
									glyph={codepoint.string}
									info={byCodepoint.get(codepoint.value)}
									value={codepoint.value}
								/>
							))}
						</ol>
					</li>
				))}
			</ol>
		</section>
	);
}

function CodepointCard({
	glyph,
	info,
	value,
}: {
	glyph: string;
	info: CodepointInfo | undefined;
	value: number;
}) {
	const hex = formatCodepoint(value);

	return (
		<li>
			<h3>
				<a
					href={`https://util.unicode.org/UnicodeJsps/character.jsp?a=${hex}`}
					target="_blank"
					rel="noreferrer"
				>
					U+{hex}
				</a>
			</h3>
			<p>{glyph}</p>
			{info?.pending ? <p>Loading</p> : <p>{info?.name}</p>}
			{info?.definition && <p>{info.definition}</p>}
		</li>
	);
}

function Examples({ onPick }: { onPick: (text: string) => void }) {
	// The first render is deterministic, so the prerendered HTML matches.
	const [shown, setShown] = useState<readonly Example[]>(() =>
		examples.slice(0, 3),
	);

	return (
		<section>
			<h2>Try an example</h2>
			<button type="button" onClick={() => setShown(pickExamples(3))}>
				Show others
			</button>
			<ul>
				{shown.map(([text, description]) => (
					<li key={text}>
						<button type="button" onClick={() => onPick(text)}>
							{text}
						</button>{" "}
						{description}
					</li>
				))}
			</ul>
		</section>
	);
}
