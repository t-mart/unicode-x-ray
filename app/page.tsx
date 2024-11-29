"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parse, type Codepoint } from "@/lib/text";
import Link from "next/link";
import {
  useState,
  useMemo,
  useEffect,
  createContext,
  useContext,
  Suspense,
  useRef,
  type DependencyList,
  type EffectCallback,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR, { SWRResponse } from "swr";
import { getName } from "@/lib/trie";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const examples = [
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

const queryParamDelayMilliseconds = 500;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

const TextContext = createContext<(text: string) => void>(() => {});

/**
 * Return a codepoint number in hexadecimal form. The string is uppercase and is
 * at least 4 characters long, zero-prefixing if necessary.
 *
 * @param codePoint The codepoint to format.
 *
 * @returns The formatted codepoint.
 */
function formatCodepoint(codepoint: Codepoint) {
  return codepoint.value.toString(16).toUpperCase().padStart(4, "0");
}

function ExampleListItem({
  text,
  description,
}: {
  text: string;
  description: string;
}) {
  const setText = useContext(TextContext);
  const router = useRouter();
  return (
    <li>
      <span
        onClick={() => {
          setText(text);
          const params = new URLSearchParams();
          params.set(textParam, text);
          router.push(`/?${params.toString()}`);
        }}
        role="button"
        className="link select-text inline p-0 m-0"
        suppressHydrationWarning
      >
        {text}
      </span>{" "}
      <span className="ml-2" suppressHydrationWarning>
        {description}
      </span>
    </li>
  );
}

function ExampleBox() {
  function chooseRandomly() {
    return examples.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  const [selected, setSelected] = useState(chooseRandomly());

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
          <ExampleListItem key={i} text={text} description={description} />
        ))}
      </ul>
    </div>
  );
}

function CodepointBox({
  codepoint,
  getNameForCodepointSWR,
}: {
  codepoint: Codepoint;
  getNameForCodepointSWR: SWRResponse<
    (codepoint: number) => string | null,
    Error,
    unknown
  >;
}) {
  const formattedCodepoint = formatCodepoint(codepoint);
  const unicodeUtilitiesUrl = `https://util.unicode.org/UnicodeJsps/character.jsp?a=${formattedCodepoint}`;
  const name = getNameForCodepointSWR.data?.(codepoint.value) ?? undefined;

  let nameContent;
  if (getNameForCodepointSWR.isLoading) {
    nameContent = <Skeleton className="w-full h-4" />;
  } else if (getNameForCodepointSWR.error) {
    console.error(getNameForCodepointSWR.error);
    nameContent = <span className="text-destructive-foreground">error!</span>;
  } else {
    nameContent = (
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

  return (
    <li className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4 text-center w-36 min-w-36">
      <h4 className="font-semibold font-mono leading-none tracking-tight">
        <Link href={unicodeUtilitiesUrl} className="link">
          U+{formattedCodepoint}
        </Link>
      </h4>
      <p className="text-4xl w-min mx-auto">&nbsp;{codepoint.string}&nbsp;</p>
      {nameContent}
    </li>
  );
}

const normalizationValues = ["None", "NFC", "NFD", "NFKC", "NFKD"] as const;
type Normalization = (typeof normalizationValues)[number];

function coerceNormalization(value: string): Normalization {
  switch (value) {
    case "NFC":
      return "NFC";
    case "NFD":
      return "NFD";
    case "NFKC":
      return "NFKC";
    case "NFKD":
      return "NFKD";
    default:
      return "None";
  }
}

export const useDebouncedEffect = (
  effect: EffectCallback,
  deps: DependencyList = [],
  delay: number
): void => {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};

function Home() {
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get(textParam) ?? "");
  const [normalization, setNormalization] = useState(
    coerceNormalization(searchParams.get(normalizationParam) ?? "None")
  );

  const parsed = useMemo(
    () =>
      parse(
        normalization === "None" ? text : text.normalize(normalization),
        segmenter
      ),
    [text, normalization]
  );
  const getNameForCodepointSWR = useSWR("/names.json", (url: string) =>
    fetch(url)
      .then((r) => r.json())
      .then((json) => (codepoint: number) => getName(codepoint, json))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // form to pushstate
  useDebouncedEffect(
    () => {
      // update the url query params
      const params = new URLSearchParams();

      if (text) {
        params.set(textParam, text);
      } else {
        params.delete(textParam);
      }

      if (normalization !== "None") {
        params.set(normalizationParam, normalization);
      } else {
        params.delete(normalizationParam);
      }

      const newUrl = new URL(window.location.href);
      newUrl.search = params.toString();

      if (newUrl.toString() !== window.location.href) {
        window.history.pushState({}, "", newUrl.toString());
      }
    },
    [text, normalization],
    queryParamDelayMilliseconds
  );

  useEffect(() => {
    window.history.replaceState({}, "", window.location.href);
  });

  // popstate to form
  useEffect(() => {
    const handlePopState = () => {
      console.log("popstate", window.location.search);
      const params = new URLSearchParams(window.location.search);
      setText(params.get(textParam) ?? "");
      setNormalization(
        coerceNormalization(params.get(normalizationParam) ?? "None")
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <TextContext.Provider value={setText}>
      <div className="space-y-4">
        <div className="grid grid-cols-[5fr,_1fr] grid-rows-2 grid-flow-col gap-x-2">
          <div>
            <Label
              htmlFor="text"
              className="text-3xl font-semibold tracking-tight pb-2"
            >
              Text
            </Label>
            {text.length > 0 && (
              <button onClick={() => setText("")} className="link text-sm ml-4">
                Clear
              </button>
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
              console.log(v);
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
        {parsed?.graphemes.length > 0 ? (
          <div>
            <h2 className="text-3xl font-semibold tracking-tight pb-2">
              Graphemes
            </h2>
            <ol className="flex flex-col w-full p-8 gap-4">
              {parsed?.graphemes.map((grapheme, i) => (
                <li key={i} className="flex gap-4 items-center">
                  <h3 className="w-24 min-w-24 font-bold text-6xl text-center">
                    {grapheme.string}
                  </h3>
                  <ol className="flex flex-row gap-4 overflow-x-scroll py-4">
                    {grapheme.codePoints.map((codePoint, j) => (
                      <CodepointBox
                        key={j}
                        codepoint={codePoint}
                        getNameForCodepointSWR={getNameForCodepointSWR}
                      />
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <ExampleBox />
        )}
      </div>
    </TextContext.Provider>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
