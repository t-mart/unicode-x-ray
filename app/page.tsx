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
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR, { SWRResponse } from "swr";
import { getName } from "@/lib/trie";
import Logo from "@/components/logo";
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
    <li className="">
      <span>
        <button
          onClick={() => {
            setText(text);
            const params = new URLSearchParams();
            params.set(textParam, text);
            router.push(`/?${params.toString()}`);
          }}
          className="link select-text"
          suppressHydrationWarning
        >
          {text}
        </button>
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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-4 w-96 mx-auto">
      <div className="flex justify-between">
        <p>Try some examples:</p>
        <button
          onClick={() => setSelected(chooseRandomly())}
          className="link text-xs"
        >
          <RefreshCw className="size-4 inline mr-1" />
          Pick new ones
        </button>
      </div>
      <ul className="flex flex-col gap-4 list-disc list-inside">
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

function useDebounceParam(value: string, delay: number) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (value) params.set(textParam, value);
      const newPath = params.toString() ? `/?${params.toString()}` : "/";
      router.push(newPath);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, router]);
}

function Home() {
  const searchParams = useSearchParams();
  const [text, setText] = useState(searchParams.get(textParam) ?? "");
  useDebounceParam(text, queryParamDelayMilliseconds);
  const parsed = useMemo(() => parse(text, segmenter), [text]);
  const getNameForCodepointSWR = useSWR("/names.json", (url: string) =>
    fetch(url)
      .then((r) => r.json())
      .then((json) => (codepoint: number) => getName(codepoint, json))
  );
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setText(params.get(textParam) ?? "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <TextContext.Provider value={setText}>
      <div className="space-y-4">
        <h1 className="text-4xl flex items-center gap-2">
          <Logo outerClassName="size-16" /> <span>Unicode X-Ray</span>
        </h1>
        <div>
          <div className="">
            <Label htmlFor="text" className="text-xl">
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
          />
        </div>
        {parsed?.graphemes.length > 0 ? (
          <div>
            <h2 className="text-xl">Graphemes</h2>
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
