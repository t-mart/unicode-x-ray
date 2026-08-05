import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { type Example, examples, pickExamples } from "../lib/examples.ts";
import { pageMeta } from "../lib/meta.ts";
import { codepointValues, type Grapheme, segment } from "../lib/text.ts";
import { type Character, useCodepointInfo } from "../lib/unicode-query.ts";

const DESCRIPTION = "See a text's Unicode graphemes and code points.";

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
    <main>
      <h1>Unicode X-Ray</h1>
      <p>{DESCRIPTION}</p>

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
    <form onSubmit={(event) => event.preventDefault()}>
      <div>
        <label htmlFor="text">Text</label>{" "}
        <input
          type="text"
          id="text"
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

      <div>
        <label htmlFor="norm">Normalization</label>{" "}
        <select
          id="norm"
          value={norm ?? ""}
          onChange={(event) =>
            update(
              input,
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

      {input.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => {
              setInput("");
              update("", norm);
            }}
          >
            Clear
          </button>{" "}
          <button type="button" onClick={copyLink}>
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </form>
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
    <section aria-labelledby="graphemes">
      <h2 id="graphemes">
        {graphemes.length} grapheme{graphemes.length === 1 ? "" : "s"}
      </h2>
      <ol>
        {graphemes.map((grapheme) => (
          <li key={grapheme.offset}>
            <p>{grapheme.string}</p>
            <ol>
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
    <li>
      <h3>
        <a
          href={`https://util.unicode.org/UnicodeJsps/character.jsp?a=${hex}`}
          target="_blank"
          rel="noreferrer"
        >
          <code>U+{hex}</code>
        </a>
      </h3>
      <p>{glyph}</p>
      {info?.pending ? <p>Loading</p> : <p>{info?.name}</p>}
      {info?.definition && <p>{info.definition}</p>}
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
    <section aria-labelledby="examples">
      <h2 id="examples">Try an example</h2>
      <button type="button" onClick={() => setShown(pickExamples(3))}>
        Show others
      </button>
      <dl>
        {shown.map(([text, description]) => (
          <Fragment key={text}>
            <dt>
              <button type="button" onClick={() => onPick(text)}>
                {text}
              </button>
            </dt>
            <dd>{description}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
