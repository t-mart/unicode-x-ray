import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { type Example, examples, pickExamples } from "../lib/examples.ts";
import { pageMeta } from "../lib/meta.ts";
import {
  buildSearch,
  type Normalization,
  normalizations,
  parseSearch,
} from "../lib/search.ts";
import { codepointValues, type Grapheme, segment } from "../lib/text.ts";
import { type Character, useCodepointInfo } from "../lib/unicode-query.ts";

const DESCRIPTION = "See a text's Unicode graphemes and code points.";

const BUTTON =
  "rounded-sm border border-line bg-raised px-3 py-1.5 text-ink-dim text-sm hover:border-line-strong hover:text-ink";

const SECTION_HEADING =
  "font-semibold text-ink-dim text-xs uppercase tracking-[0.14em]";

export const Route = createFileRoute("/")({
  component: XRay,
  validateSearch: parseSearch,
  head: () => ({
    meta: pageMeta({
      title: "Unicode X-Ray",
      description: DESCRIPTION,
      path: "/",
    }),
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
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-semibold text-4xl tracking-tight">Unicode X-Ray</h1>
      <p className="mt-2 text-ink-dim">{DESCRIPTION}</p>

      <Form text={text} norm={norm} update={update} />

      {graphemes.length > 0 ? (
        <Graphemes graphemes={graphemes} byCodepoint={byCodepoint} />
      ) : (
        <Examples onPick={(picked) => update(picked, norm)} />
      )}
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
  const [input, setInput] = useState(text);

  useEffect(() => setInput(text), [text]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    // Nothing to submit: every control writes to the URL as it changes.
    <form
      onSubmit={(event) => event.preventDefault()}
      className="mt-8 flex flex-col gap-4 rounded-sm border border-line bg-surface p-4"
    >
      <div>
        <label htmlFor="text" className={`block ${SECTION_HEADING}`}>
          Text
        </label>
        <input
          type="text"
          id="text"
          className="specimen mt-2 w-full rounded-sm border border-line bg-page px-3 py-2.5 text-lg text-ink placeholder:text-ink-faint"
          value={input}
          placeholder="Put your text here"
          // biome-ignore lint/a11y/noAutofocus: the input is the whole point of the page
          autoFocus
          onChange={(event) => {
            setInput(event.target.value);
            update(event.target.value, norm);
          }}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Normalizations norm={norm} onChange={(next) => update(input, next)} />

        {input.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              className={BUTTON}
              onClick={() => {
                setInput("");
                update("", norm);
              }}
            >
              Clear
            </button>
            <button type="button" className={BUTTON} onClick={copyLink}>
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function Normalizations({
  norm,
  onChange,
}: {
  norm: Normalization | undefined;
  onChange: (norm: Normalization | undefined) => void;
}) {
  const options: readonly (Normalization | "")[] = ["", ...normalizations];

  return (
    <fieldset>
      <legend className={SECTION_HEADING}>Normalization</legend>
      <div className="mt-2 flex flex-wrap gap-1 rounded-sm border border-line bg-page p-1">
        {options.map((value) => (
          <label key={value || "none"} className="cursor-pointer">
            <input
              type="radio"
              name="norm"
              value={value}
              checked={(norm ?? "") === value}
              onChange={() => onChange(value || undefined)}
              className="peer sr-only"
            />
            <span className="block rounded-xs px-3 py-1.5 font-mono text-ink-dim text-sm hover:text-ink peer-checked:bg-accent peer-checked:font-semibold peer-checked:text-page peer-focus-visible:outline-2 peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2">
              {value || "None"}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Graphemes({
  graphemes,
  byCodepoint,
}: {
  graphemes: readonly Grapheme[];
  byCodepoint: ReadonlyMap<number, Character>;
}) {
  return (
    <section aria-labelledby="graphemes" className="mt-10">
      <h2 id="graphemes" className={SECTION_HEADING}>
        {graphemes.length} grapheme{graphemes.length === 1 ? "" : "s"}
      </h2>
      <ol className="mt-4 flex flex-col gap-3">
        {graphemes.map((grapheme) => (
          <li
            key={grapheme.offset}
            className="flex flex-col overflow-hidden rounded-sm border border-line bg-surface sm:flex-row"
          >
            <p
              dir="ltr"
              className="specimen tile min-h-28 shrink-0 overflow-hidden border-line border-b px-4 py-2 text-5xl sm:max-w-64 sm:min-w-32 sm:border-r sm:border-b-0"
            >
              {grapheme.string}
            </p>
            <ol className="flex flex-1 flex-wrap gap-3 p-3">
              {grapheme.codepoints.map((codepoint) => (
                <CharacterCard
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

function CharacterCard({
  glyph,
  info,
  value,
}: {
  glyph: string;
  info: Character | undefined;
  value: number;
}) {
  const hex = formatCodepoint(value);

  return (
    <li className="flex w-full flex-col gap-2.5 rounded-sm border border-line bg-raised p-3 sm:w-56">
      <h3 className="font-mono text-sm">
        <a
          href={`https://util.unicode.org/UnicodeJsps/character.jsp?a=${hex}`}
          target="_blank"
          rel="noreferrer"
          className="no-underline hover:underline"
        >
          <code>U+{hex}</code>
        </a>
      </h3>
      <p
        dir="ltr"
        className="specimen tile h-20 overflow-hidden rounded-xs border border-line bg-page p-1 text-3xl"
      >
        {glyph}
      </p>
      {info?.pending ? (
        <p>
          <span className="sr-only">Loading</span>
          <span
            aria-hidden="true"
            className="block h-3 w-3/4 animate-pulse rounded-xs bg-line-strong"
          />
        </p>
      ) : (
        <p className="text-ink-dim text-xs leading-snug tracking-wide">
          {info?.name}
        </p>
      )}
      {info?.definition && (
        <p className="text-ink-faint text-xs leading-snug">{info.definition}</p>
      )}
    </li>
  );
}

function Examples({ onPick }: { onPick: (text: string) => void }) {
  // The prerendered HTML holds no random pick, so the first three stand in
  // until the browser has hydrated and can choose.
  const [shown, setShown] = useState<readonly Example[]>(() =>
    examples.slice(0, 3),
  );
  useEffect(() => setShown(pickExamples(3)), []);

  return (
    <section aria-labelledby="examples" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 id="examples" className={SECTION_HEADING}>
          Try an example
        </h2>
        <button
          type="button"
          className={BUTTON}
          onClick={() => setShown(pickExamples(3))}
        >
          Show others
        </button>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {shown.map(([text, description]) => (
          <div
            key={text}
            className="flex flex-col overflow-hidden rounded-sm border border-line bg-surface"
          >
            <dt>
              <button
                type="button"
                dir="ltr"
                onClick={() => onPick(text)}
                className="specimen tile h-32 w-full overflow-hidden break-all border-line border-b p-3 text-2xl leading-tight hover:bg-raised"
              >
                {text}
              </button>
            </dt>
            <dd className="p-3 text-ink-dim text-sm leading-snug">
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
