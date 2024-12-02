"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Grapheme, parse, type Codepoint } from "@/lib/text";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWRImmutable from "swr/immutable";

type Example = [string, string];

const examples: Example[] = [
  ["Z̷̲̫̼͓̑͂͆ã̴͚̆l̴̛͍͓̙̫̔g̵̛̦̰̉͐ó̶̫̓̚", '"Zalgo" text with combining characters'],
  ["🧜🏻‍♂️", "An emoji sequence"],
  ["🇺🇸", "A regional indicator"],
  ["ǝʇɐɯ ʎɐp,פ", "Upside-down text"],
  ["ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖ", "Superscript letters"],
  ["℘ℑℜℵ∭∰‱↉⅍", "Mathematical notation symbols"],
  ["𝓑𝓮𝓪𝓾𝓽𝓲𝓯𝓾𝓵", "Mathematical script letters"],
  ["ﬆﬅﬃ", "Ligatures"],
  ["𝔤𝔬𝔱𝔥𝔦𝔠", "Fraktur/blackletter text"],
  ["⑴⑵⑶⒜⒝⒞", "Enclosed alphanumerics"],
  ["⠓⠑⠇⠇⠕", "Braille patterns"],
  ["Ｈｅｌｌｏ Ｗｏｒｌｄ １２３", "Fullwidth text"],
  ["こんにちは", "Japanese hiragana"],
  ["안녕하세요", "Korean hangul"],
  ["你好", "Chinese hanzi"],
  ["ᚹᛁᛋᛞᚩᛗ", "Old English runes"],
  ["नमस्ते", "Devanagari script"],
  ["မင်္ဂလာပါ", "Burmese script"],
  ["สวัสดี", "Thai script"],
  ["ꦱꦸꦒꦼꦁꦱꦶꦪꦁ", "Javanese script"],
  ["ᓂᔅᑯᒧᐃᐧᐣ", "Canadian Aboriginal syllabics"],
  ["ܫܠܡܐ", "Syriac script"],
  ["ʤʢħŋɣʃθʊʏ", "IPA (phonetic alphabet) symbols"],
  ["ᬓᬭᬫ ᬱᬗᬓᬭ", "Balinese script"],
  ["♜♞♝♛♚♟", "Chess pieces"],
  ["𝕎𝕙𝕒𝕥", "Double-struck (blackboard bold) letters"],
  ["⌘⌥⇧⌫", "Mac keyboard symbols"],
  ["ꬴꬓ꬀ꬂ", "Old Hungarian script"],
  ["௧௨௩௪", "Tamil numerals"],
  ["የሰላም", "Ethiopic script"],
  ["⁰¹²³⁴⁵⁶⁷⁸⁹", "Superscript numbers"],
  ["❶❷❸❹❺", "Circled numbers (filled)"],
  ["السَّلامُ عَلَيْكُمْ", "Arabic script"],
];

const textParam = "text";
const normalizationParam = "norm";

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * Return a codepoint number in hexadecimal form. The string is uppercase and is
 * at least 4 characters long, zero-prefixing if necessary.
 *
 * @param codePoint The codepoint to format.
 *
 * @returns The formatted codepoint.
 */
function formatCodepoint(codepoint: number) {
  return codepoint.toString(16).toUpperCase().padStart(4, "0");
}

function ExampleListItem({
  text,
  setText,
  description,
}: {
  text: string;
  setText: (text: string) => void;
  description: string;
}) {
  return (
    <li>
      <span
        onClick={() => {
          setText(text);
          const params = new URLSearchParams();
          params.set(textParam, text);
        }}
        role="button"
        className="link select-text inline p-0 m-0"
      >
        {text}
      </span>{" "}
      <span className="ml-2">{description}</span>
    </li>
  );
}

function ExampleBox({ setText }: { setText: (text: string) => void }) {
  function chooseRandomly() {
    return examples.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  const [selected, setSelected] = useState<Example[]>([]);

  // do this in an effect. we don't want this done on the server because it is
  // derived from randomness
  useEffect(() => {
    setSelected(chooseRandomly());
  }, []);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4 max-w-96 mx-auto">
      <div className="flex justify-between flex-wrap gap-2">
        <p>Try some examples:</p>
        <button
          onClick={() => setSelected(chooseRandomly())}
          className="link text-xs"
        >
          <RefreshCw className="size-4 inline mr-1" />
          Pick new ones
        </button>
      </div>
      <ul className="list-disc space-y-4 list-inside">
        {selected.map(([text, description], i) => (
          <ExampleListItem
            key={i}
            text={text}
            description={description}
            setText={setText}
          />
        ))}
      </ul>
    </div>
  );
}

function CodepointBox({ codepoint }: { codepoint: Codepoint }) {
  const formattedCodepoint = formatCodepoint(codepoint.value);
  const unicodeUtilitiesUrl = `https://util.unicode.org/UnicodeJsps/character.jsp?a=${formattedCodepoint}`;

  return (
    <li className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4 text-center w-36 min-w-36">
      <h4 className="font-semibold font-mono leading-none tracking-tight">
        <Link href={unicodeUtilitiesUrl} className="link">
          U+{formattedCodepoint}
        </Link>
      </h4>
      <p className="text-4xl w-min mx-auto">&nbsp;{codepoint.string}&nbsp;</p>
      <CodepointName codepoint={codepoint.value} />
    </li>
  );
}

function CodepointName({ codepoint }: { codepoint: number }) {
  const {
    data: name,
    error: isError,
    isLoading: isPending,
    error,
  } = useSWRImmutable(`/api/names/${formatCodepoint(codepoint)}`, (url) =>
    fetch(url)
      .then((res) => res.json())
      .then((json) => json.name)
  );

  if (isPending) {
    return <Skeleton className="w-full h-4" />;
  } else if (isError) {
    return <span className="text-destructive-foreground">{error.message}</span>;
  } else {
    return (
      <Popover>
        <PopoverTrigger>
          <p className="line-clamp-3 decoration-dotted underline">{name}</p>
        </PopoverTrigger>
        <PopoverContent>
          <p className="text-center">{name ?? "<unknown>"}</p>
        </PopoverContent>
      </Popover>
    );
  }
}

const normalizationValues = ["None", "NFC", "NFD", "NFKC", "NFKD"] as const;
type Normalization = (typeof normalizationValues)[number];

function coerceNormalization(value: string | null): Normalization {
  if (value === null) {
    return "None";
  }

  if (normalizationValues.includes(value as Normalization)) {
    return value as Normalization;
  }
  return "None";
}

function copyToClipboard(text: string, normalization: Normalization) {
  const url = new URL(window.location.href);
  url.searchParams.set(textParam, text);
  if (normalization !== "None") {
    url.searchParams.set(normalizationParam, normalization);
  }
  navigator.clipboard.writeText(url.toString());
}

function Graphemes({ graphemes }: { graphemes: Grapheme[] }) {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight pb-2">Graphemes</h2>
      <ol className="flex flex-col w-full p-8 gap-4">
        {graphemes.map((grapheme, graphemeIndex) => (
          <li
            key={`${graphemeIndex}-${grapheme.string}`}
            className="flex gap-4 items-center"
          >
            <h3 className="w-24 min-w-24 font-bold text-6xl text-center">
              {grapheme.string}
            </h3>
            <ol className="flex flex-row gap-4 overflow-x-scroll py-4">
              {grapheme.codePoints.map((codePoint, codePointIndex) => (
                <CodepointBox
                  key={`${codePoint.value}-${codePointIndex}`}
                  codepoint={codePoint}
                />
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Form({
  text,
  setText,
  normalization,
  setNormalization,
}: {
  text: string;
  setText: (text: string) => void;
  normalization: Normalization;
  setNormalization: (normalization: Normalization) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="grid grid-cols-[5fr,_1fr] grid-rows-2 grid-flow-col gap-x-2">
      <div>
        <Label
          htmlFor="text"
          className="text-3xl font-semibold tracking-tight pb-2"
        >
          Text
        </Label>
        {text.length > 0 && (
          <>
            <button onClick={() => setText("")} className="link text-sm ml-4">
              Clear
            </button>
            <button
              onClick={() => {
                copyToClipboard(text, normalization);
              }}
              className="link text-sm ml-4"
            >
              Copy link to clipboard
            </button>
          </>
        )}
      </div>
      <Input
        placeholder="Put your text here"
        id="text"
        className="mt-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        ref={inputRef}
      />
      <Label
        htmlFor="text"
        className="text-sm font-semibold tracking-tight pb-2 self-end"
      >
        Normalization
        <Link href="/about#normalization" className="link">
          (?)
        </Link>
      </Label>
      <Select
        value={normalization}
        onValueChange={(v) => {
          setNormalization(v as Normalization);
        }}
      >
        <SelectTrigger className="mt-2" id="normalization">
          <SelectValue placeholder="Normalization" />
        </SelectTrigger>
        <SelectContent>
          {normalizationValues.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function XRay() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [text, setText] = useState(searchParams.get(textParam) ?? "");
  const [normalization, setNormalization] = useState(
    coerceNormalization(searchParams.get(normalizationParam))
  );

  useEffect(() => {
    router.push("/");
  }, [router]);

  const parsed = useMemo(() => {
    let t = text;
    if (normalization !== "None") {
      t = t.normalize(normalization);
    }

    return parse(t, segmenter);
  }, [text, normalization]);

  return (
    <Suspense>
      <div className="space-y-4">
        <Form
          text={text}
          setText={setText}
          normalization={normalization}
          setNormalization={setNormalization}
        />
        {parsed.graphemes.length > 0 ? (
          <Graphemes graphemes={parsed.graphemes} />
        ) : (
          <ExampleBox setText={setText} />
        )}
      </div>
    </Suspense>
  );
}

export default function Page() {
  return (
    <Suspense>
      <XRay />
    </Suspense>
  );
}
