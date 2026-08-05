# Handoff: unicode-x-ray review and rework plan

This document records a review of the original project and the plan that
replaces it. Section 4 is the live checklist. Tick items as they land.

Original project: /home/tim/code/unicode-x-ray (Next.js). Read it for
implementation detail. All new work lands here.

This repository is a fresh TanStack Start scaffold, not a migration. The stack
is fixed: TanStack Start, TanStack Router (file routes), Vite 8, Tailwind 4,
Biome, TypeScript 7, pnpm, React 19.2. Half the original commit plan was
Next.js removal work and no longer applies. Section 4 records what replaced it.

---

## 1. Current state

The application splits text into graphemes and code points. It shows a name for
each code point.

- Framework: Next.js 15.1.5 (App Router), React 19.0, Tailwind 3.4.
- Components: shadcn/ui over Radix (Input, Label, Popover, Select, Skeleton).
- Names data: one 3.4 MB JSON file, loaded by a server action.
- Generator: `scripts/gen-data/main.ts` downloads UCD files and writes the JSON.
- Tests: none.
- `tsc --noEmit` and `next lint` both pass.

---

## 2. Review findings

### 2.1 What works

- **Segmentation is correct.** `lib/text.ts` delegates to `Intl.Segmenter` with
  `granularity: "grapheme"`. This is the engine ICU implementation of UAX #29
  extended grapheme clusters. Do not replace it. Code point iteration inside a
  segment is also correct, because string iteration keeps surrogate pairs whole.
- **The range encoding is a good design.** `lib/trie.ts` run-length encodes
  contiguous equal names and binary searches the result. The binary search is
  correct, including the fall-through path that checks the preceding range.
- **The name pipeline is a good idea.** The three layers (UnicodeData, then
  DerivedName, then an appended Unihan definition) give better names than the
  official names alone.
- **The examples list teaches the concept well.**

### 2.2 Defects

| ID  | Defect                                                                                                                                                                          | Location                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| D1  | A single unnamed code point fails the whole batch. `getName` returns null, the action throws, the client has no `.catch`, and every name stays a skeleton.                      | `actions/names.ts:19`, `app/page.tsx:377`   |
| D2  | Data is Unicode 16.0. Runtimes are Unicode 17.0. 4,803 assigned code points have no name.                                                                                       | `actions/names.json`                        |
| D3  | Four C1 controls have no name, because their Unicode 1.0 name field is empty.                                                                                                   | `scripts/gen-data/main.ts` `getControlName` |
| D4  | `actions/names.json` and `app/api/names/[codepoint]/names.json` are byte-identical. Both are committed. Total 6.85 MB.                                                          | repository                                  |
| D5  | The API route is dead. Nothing references it. It also sets `force-static` with no `generateStaticParams`.                                                                       | `app/api/names/[codepoint]/route.ts`        |
| D6  | `gen-data` writes to `public/names.json`. That path matches no consumer and does not exist.                                                                                     | `package.json`                              |
| D7  | The name and definition are fused into one string, `NAME (definition)`. The format cannot be parsed back.                                                                       | `scripts/gen-data/main.ts`                  |
| D8  | `if (codepoint in names)` tests object properties of a `Map`, not keys. It is always false.                                                                                     | `actions/names.ts:14`                       |
| D9  | `console.log(names)` runs on the server for every keystroke.                                                                                                                    | `actions/names.ts:24`                       |
| D10 | `examples.sort(() => Math.random() - 0.5)` mutates the module array in place and is a biased shuffle.                                                                           | `app/page.tsx:113`                          |
| D11 | `router.push("/")` on mount deletes the query string. It also destroys the URL that "Copy link" produces.                                                                       | `app/page.tsx:352`                          |
| D12 | `CodepointName` copies context into state through an effect. The value never updates after the first set.                                                                       | `app/page.tsx:171`                          |
| D13 | `scripts/gen-data/README.md` describes `NameAliases.txt` and replacement of names. The code reads UnicodeData field 10 and appends definitions.                                 | `scripts/gen-data/README.md`                |
| D14 | `@tailwindcss/typography` is a dependency and a plugin, but nothing uses it. `max-w-prose` is core Tailwind.                                                                    | `tailwind.config.ts`                        |
| D15 | The About page says graphemes are the visual units that make sense to our eyes. This is false for the Devanagari, Burmese, Javanese, and Thai examples in the same application. | `app/about/page.tsx`                        |
| D16 | `Set.prototype.difference` is ES2025, but `tsconfig.scripts.json` pins `lib: ["es2023"]`. The two configs disagree.                                                             | `tsconfig.scripts.json`                     |
| D17 | `tsconfig.scripts.json` has mixed line endings. It shows a full-file diff with no content change.                                                                               | repository                                  |

### 2.3 Unnamed code points, measured

All 1,114,112 code points were resolved against the committed table. 819,537
returned null. The breakdown:

| Bucket               |   Count | Real gap |
| -------------------- | ------: | -------- |
| Unassigned (`gc=Cn`) | 814,664 | No       |
| Noncharacters        |      66 | No       |
| Assigned but unnamed |   4,807 | **Yes**  |

The 4,807 split into 4 C1 controls (D3) and 4,803 Unicode 17.0 additions (D2).
Version probes confirm the data version:

```
15.1  U+2FFC   present     16.0  U+1E5D0  present
16.0  U+105C0  present      17.0  U+11B60  null
16.0  U+11BC0  present      17.0  U+1ACF   null
```

Unicode 17.0 added 4,803 characters. The count matches exactly.

### 2.4 Segmentation caveats

The segmentation is correct. Three facts still need attention:

1. **Version skew.** Segmentation comes from the browser ICU. Names come from a
   file frozen at generation time. The two can disagree. Show the data version
   in the interface.
2. **Locale.** `new Intl.Segmenter(undefined, ...)` uses the host locale. CLDR
   has no grapheme tailorings outside root, so output is stable in practice.
   Pass an explicit locale anyway, because a shared link must show the same
   result to everyone.
3. **Extended grapheme clusters are not aksharas.** This is correct UAX #29
   behaviour. The About page text contradicts it (D15). Measured on ICU 78.3,
   which carries UAX #29 rule GB9c:

   | Input      | Clusters              |
   | ---------- | --------------------- |
   | `क्ष`      | `क्ष`                 |
   | `हिन्दी`   | `हि` / `न्दी`         |
   | `ကျွန်ုပ်` | `ကျွ` / `န်ု` / `ပ်`  |
   | `ไทย`      | `ไ` / `ท` / `ย`       |
   | `ꦧꦱꦗꦮ`     | `ꦧ` / `ꦱ` / `ꦗ` / `ꦮ` |

   Devanagari conjuncts hold together, so the old "breaks at virama joins" note
   was wrong for this ICU version. Thai still splits a prepended vowel from its
   consonant, and Javanese splits every letter. The claim is false either way.

### 2.5 Data measurements

Current file, and the same data with the name and definition separated:

| Form                    |  Nodes |     Raw |   gzip |     brotli |
| ----------------------- | -----: | ------: | -----: | ---------: |
| Today, fused            | 74,848 | 3.27 MB | 680 KB |     460 KB |
| Names only, recollapsed | 45,395 | 1.53 MB | 273 KB | **167 KB** |
| Definitions only        | 23,289 | 1.01 MB | 361 KB | **262 KB** |

Definitions break the run-length encoding. Each unique definition ends a run.
Proof: after the split, **U+4E00 to U+9FFF (20,992 CJK ideographs) collapses to
1 node**, because every one of them has the name `CJK UNIFIED IDEOGRAPH`.

Chunk size test on the names layer:

| Granularity           | Chunks | Sum (brotli) |   Largest |
| --------------------- | -----: | -----------: | --------: |
| Per plane (`>>16`)    |      7 |       168 KB |     96 KB |
| **Per 4096 (`>>12`)** | **82** |   **175 KB** | **22 KB** |

Chunks at 4096 cost 8 KB (5%) in lost compression. Take that trade.

Reference points, brotli:

```
U+0000 to U+05FF   (Latin, Greek, Cyrillic, Hebrew, Arabic)    7.8 KB
U+0000 to U+2FFF   (most text that people type)                 54 KB
U+1F300 to U+1FAFF (emoji)                                      12 KB
Blocks.txt as a range array (346 blocks)                        3.5 KB
```

### 2.6 Proof that the fused format is lossy

A regex `/^(.*?) \((.*)\)$/` over the current data matches 23,289 entries. Only
23,285 are Han. The other four are false splits:

```
U+000A  "LINE FEED (LF)"        U+000D  "CARRIAGE RETURN (CR)"
U+000C  "FORM FEED (FF)"        U+0085  "NEXT LINE (NEL)"
```

Parentheses carry two meanings in one field: Unicode 1.0 control abbreviations,
and Unihan definitions. Keep the two values in separate fields.

---

### 2.7 Measured after implementation

The predictions in §2.5 held. Actual output at Unicode 17.0.0:

| Layer  |     Raw |   brotli | Chunks |
| ------ | ------: | -------: | -----: |
| names  | 1.55 MB | 177.7 KB |     83 |
| defs   | 1.59 MB | 376.3 KB |     28 |
| blocks |   11 KB |   3.6 KB |      1 |

Largest name chunk: 22.2 KB brotli. 45,855 ranges, 105 aliases, 27,665
definitions, 346 blocks.

Two corrections to §2.5. The name layer needs 83 chunks, not 82, because
Unicode 17 crosses one more boundary. Chunked definitions cost more than the
262 KB single-blob estimate, but they load on demand.

The definition layer grew when Unikemet arrived (§3.4). Chunk `0x13` is 52.4 KB
brotli and chunk `0x14` is 15.7 KB. Only a reader of Egyptian hieroglyphs pays
for either. This is what the chunking was for.

---

## 3. Decisions

These are settled. Do not reopen them.

1. **Keep a router.** `/about` must stay a real URL. Its anchor links need it.
2. **Unknown code points show
   `<unknown, Combining Diacritical Marks Extended>`.** The word "unknown" tells
   the user that the software is behind, not that the code point is reserved.
   Use the block name from `Blocks.txt`.
3. **Export the data version with each run.** Use it for two purposes: to decide
   if a refresh is necessary, and to show the version to users. Do not add a
   separate marker file.
4. **Name large uniform ranges as ranges.** Do not expand them per code point.
   Use canonical block names from `Blocks.txt`.
5. **Migrate to Vite and a static build.** Keep Vercel as a deploy target. The
   output must also run on any static file server.
6. **Remove shadcn and Radix.** Five components do not need the abstraction.
   Moot in this repository. Write plain elements the first time.
7. **Split name from definition on disk.** Chunk both by `codepoint >> 12`.
8. **SPA mode with prerender.** `spa.prerender.outputPath` is `/index.html`, so
   the shell lands at the root and a plain file server resolves `/`. Route
   components render on the client. Real paths, never hash locations.
9. **No analytics.** Plausible does not come across.
10. **TypeScript 7.** Settled by the scaffold. Open item 1 is closed.
11. **Biome, not ESLint.** Every ESLint task in the original plan is void.
12. **Precompression is opt-in.** `gen-data --compress` writes `.br` and `.gz`
    siblings. Default off, because about 220 binary files that churn every
    Unicode release are worse than letting the host compress.
13. **TanStack Query fetches the chunks.** Not for the caching. The files are
    immutable, so they never go stale and never refetch. The reason is
    reactivity: a module-level cache is invisible to React, and bridging it with
    an effect rebuilds the D12 defect. Query makes chunk arrival a render
    dependency. Keep lookups pure and let Query be the only cache. No SSR
    dehydration is needed, because SPA mode runs no route code on the server.
14. **Inline data lives in `src/data`, fetched data in `public/data`.** Vite
    refuses to import anything under `public`, and the dev server fails with an
    error. The generator writes the manifest and the blocks to `src/data`, which
    the bundle inlines, and the name and definition chunks to `public/data`,
    which the browser fetches by URL. `--inline-output` sets the first path,
    `--output` the second.

### 3.1 On range naming (answer to question 4)

Yes, the generator expands ranges per code point today. `iterateUnicodeData`
yields every code point between a `<..., First>` row and a `<..., Last>` row.
That expands 137,468 private use code points and 2,048 surrogates into
individual map entries. `rangeTrieify` then collapses them back.

The output size is fine, because the run-length encoding recovers it. Two
problems remain:

- The generator holds about 294,000 map entries in memory for no benefit.
- The range labels are the only 6 non-uppercase names in the whole table:
  `Private Use`, `Low Surrogate`, `Plane 15 Private Use`, and 3 more. Every
  other name is uppercase.

Correction, found during implementation: no layer needs per code point
expansion. `DerivedName.txt` writes CJK, Tangut, Egyptian, Khitan, and Nushu as
range rows with a `-*` suffix. Strip the suffix and each range collapses to one
node. Hangul is the only block that is genuinely per code point, because each of
its 11,172 syllables has a distinct name.

`Blocks.txt` supplies canonical replacements. It is confirmed reachable and it
is 346 rows:

```
D800..DB7F; High Surrogates              E000..F8FF;   Private Use Area
DB80..DBFF; High Private Use Surrogates  F0000..FFFFF; Supplementary Private Use Area-A
DC00..DFFF; Low Surrogates               100000..10FFFF; Supplementary Private Use Area-B
```

### 3.2 Version detection (confirmed to work)

Fetch `https://www.unicode.org/Public/UCD/latest/ReadMe.txt`. Apply this regex:

```
/Version (\d+\.\d+\.\d+) of the Unicode Standard/
```

It returns `17.0.0` today. Verified against the live file.

Pin the downloads to that version. The correct base is
`https://www.unicode.org/Public/<version>/ucd/`. Note that
`https://www.unicode.org/Public/UCD/<version>/ucd/` returns 404. Only the
`latest` alias sits under the `UCD` path segment.

### 3.3 Target data layout

```
public/data/manifest.json      version, chunk size, chunk index
public/data/blocks.json        346 range rows, 3.5 KB brotli, bundle inline
public/data/names/0.json       names, run-length encoded, key = cp >> 12
public/data/names/1.json
...
public/data/defs/4.json        Unihan definitions, key = cp >> 12
```

Chunk file names are decimal, not hex. `blocks.json` holds
`[start, end, name]` rows.

Manifest shape:

```json
{
  "unicodeVersion": "17.0.0",
  "generated": "2026-08-04",
  "chunkBits": 12,
  "nameChunks": [0, 1, 2],
  "defChunks": [4, 5]
}
```

Name chunk shape stays the current node format:

```
[[cp, "NAME"], [cp, [runLength, "NAME"]], ...]
```

Definition chunk shape is a plain pair list. Definitions are unique, so
run-length encoding gives nothing:

```
[[cp, "one; a, an; alone"], ...]
```

### 3.4 Name layers, revised

The original three layers left two gaps. Both are closed. Order runs from
lowest precedence to highest:

1. `UnicodeData.txt`, for the surrogate and private use ranges.
2. `extracted/DerivedName.txt`, which names everything else that has a name.
3. The Unicode 1.0 name field, the only name a control has in `UnicodeData.txt`.
4. `NameAliases.txt`, taking `correction`, `alternate`, `control`, then
   `figment`. `abbreviation` is skipped: LF and BOM are short forms, not names.

A Unicode name is immutable, so a wrong name is never fixed in place. The
correction goes in `NameAliases.txt`. Measured effects at 17.0.0:

| Code point | Formal name                  | Applied name                 |
| ---------- | ---------------------------- | ---------------------------- |
| U+2118     | SCRIPT CAPITAL P             | WEIERSTRASS ELLIPTIC FUNCTION|
| U+FE18     | ...LENTICULAR BRAKCET        | ...LENTICULAR BRACKET        |
| U+0CDE     | KANNADA LETTER FA            | KANNADA LETTER LLLA          |
| U+01A2     | LATIN CAPITAL LETTER OI      | LATIN CAPITAL LETTER GHA     |
| U+FEFF     | ZERO WIDTH NO-BREAK SPACE    | BYTE ORDER MARK              |
| U+0007     | BELL (collides with U+1F514) | ALERT                        |
| U+000A     | LINE FEED (LF)               | LINE FEED                    |

D3 is closed. U+0084 takes the `control` alias INDEX. U+0080, U+0081, and
U+0099 take `figment` aliases, which Unicode defines as labels that no standard
ever approved. A figment beats no name. Every assigned code point now resolves,
with no exceptions.

Definitions come from two files, merged: `kDefinition` in `Unihan_Readings.txt`
and `kEH_Desc` in `Unikemet.txt`, which is new in 17.0. `kEH_Desc` covers 4,380
Egyptian hieroglyphs, 932 of 1,072 in the main block and 3,448 of 3,995 in
Extended-A. `kEH_Func` exists too and is skipped: one field per meaning.

Rejected: `NamesList.txt`. It carries 2,525 informative aliases, but its own
header says it "should not be parsed for machine-readable information", and its
best content is already in `NameAliases.txt`.

---
## 4. Commit plan

Message format: `[area]: [short line describing the main effect]`. Do not add
co-author trailers.

The original plan had 16 commits. Six were Next.js removal and are void here:
C1 (no server action exists), C2 (no dead route), C10 (Vite is the scaffold),
C11 (no Radix to remove), C13 (no Next to remove), and the dependency half of
C14. The order also flips: the generator comes first, because there is no
application to keep working.

- [x] **S1. `build: tighten the TypeScript config and produce static output`**

  Replaces the config half of C14. Set `lib` to ES2025 for
  `Set.prototype.difference` (D16), plus `moduleDetection`, `erasableSyntaxOnly`,
  `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. Drop
  `@tailwindcss/typography` (D14). Point Biome at `scripts/`. Turn on SPA mode
  and prerender per decision 8.

  Done: `/`, `/about`, and the assets all return 200 from a plain file server.

- [x] **S2. `gen-data: generate chunked Unicode name and definition data`**

  Merges C3 through C6, which produced throwaway intermediate formats on their
  own. Detects the version, pins the downloads to it, splits name from
  definition (D7), fixes the C1 controls (D3), names uniform ranges from
  `Blocks.txt` (decision 4), and writes the §3.3 layout with the manifest last.

  Done: all 299,382 assigned code points resolve except U+0080, U+0081, U+0084,
  and U+0099, which fall through to the S3 fallback. See §2.7 for sizes.

- [x] **S3. `lib: add chunk lookup and the unknown fallback`**

  C7, less the pluggable fetch seam. That seam existed to survive the
  Next-to-Vite migration, which does not happen here. Adds the block lookup and
  the `<unknown, Block Name>` fallback (decision 2).

  TanStack Query owns the cache (decision 13). `unicode.ts` holds pure
  functions only. `unicode-query.ts` holds the query options and the
  `useCodepointInfo` hook.

  Change to C12: `manifest.json` and `blocks.json` are bundled inline, but
  chunk 0 is prefetched instead. Chunk 0 is 126 KB raw, and every visit would
  pay to parse it. A prefetch in `getRouter` starts the request before the
  first keystroke and costs the bundle nothing.

  Done: `U+0080` shows `<unknown, Latin-1 Supplement>`, `U+0041` shows
  `LATIN CAPITAL LETTER A`, and U+6F22 resolves a name and a definition from
  separate chunks.

- [x] **S4. `lib: segment text into graphemes and code points`**

  `src/lib/text.ts`. `Intl.Segmenter` with `granularity: "grapheme"` and the
  explicit locale `en`, because a shared link must show the same result to
  everyone (§2.4 item 2). `segment(text)` returns graphemes; `codepointValues`
  flattens them for `useCodepointInfo`.

  Change: the `Text` wrapper type is gone. It held the input string, which the
  caller already has.

  Done: emoji with a skin tone modifier and a ZWJ stay one grapheme, a flag
  pair splits into two, `\r\n` stays one, and combining marks join the letter
  before them. §2.4 item 3 now records what ICU 78.3 measures.

- [x] **S5. `test: cover the name table, chunking, and segmentation`**

  C15. vitest 4, with `vitest.config.ts` separate from `vite.config.ts`: the
  tests need no router, no Nitro, and no Tailwind. 35 tests in 1.1 s.

  | File                            | Covers                                    |
  | ------------------------------- | ----------------------------------------- |
  | `src/lib/names.test.ts`         | Run length round trip, merges, boundaries |
  | `src/lib/text.test.ts`          | Segmentation, including the D15 evidence  |
  | `src/lib/unicode.test.ts`       | Block search, fallbacks, chunk arithmetic |
  | `scripts/gen-data/write.test.ts`| Chunk splitting, definition grouping      |
  | `src/lib/data.test.ts`          | The generated files themselves            |

  The property test uses the runtime as an independent oracle: every code point
  that `\p{Assigned}` matches must resolve to a name. It reports exactly the
  four unnamed controls U+0080, U+0081, U+0084, and U+0099. The oracle holds
  only while the runtime and the data file agree on the Unicode version, so the
  test skips when they differ. Node 26.5.1 carries ICU 78.3 and Unicode 17.0,
  and the data file is 17.0.0.

  `groupNames` and `groupDefinitions` are now exported from `write.ts`.

- [x] **S6. `app: build the inspector route`**

  C8 and the UI half of C12. `validateSearch` reads `?text=` and `?norm=`, and
  the URL is the only state. Nothing copies it into a component, so D11 and D12
  are unwritable. `pickExamples` shuffles a copy, so D10 is unwritable, and the
  first render takes the first three examples so the prerendered HTML matches.
  The definition is its own element under the name. Native `<select>`, real
  `<label>`, no popover. The card is 11 rem wide and lets a long name wrap.

  Added: `useCodepointInfo` now reports `pending` per code point. A chunk that
  has not arrived shows "Loading" instead of the block fallback, which would
  otherwise read as a real answer. `segment` now records the offset of each
  grapheme and code point, which gives React a stable key for repeated
  characters.

  Also replaced the scaffold branding in `Header`, `Footer`, and the document
  title. The footer carries the data version.

- [x] **S7. `app: write the about page`**

  The correction half of C16. The prose is the original text, ported as written.
  Three changes only:

  1. D15 is deleted. The claim that graphemes are "the visual units that make
     sense to our eyes" is gone. A new paragraph follows the pedagogy of UAX #29
     instead: a grapheme is a good guess, the rules are the same for all
     languages, and a Slovak reader calls `ch` one letter while the tool shows
     two. The measured Indic and Southeast Asian splits stay in §2.4 item 3,
     where they belong. They mean nothing to an English reader.
  2. A new "Versions" section states that the browser supplies the segmentation
     and the data file supplies the names. It reads the version from the
     manifest and explains what `<unknown, Block Name>` means.
  3. The Unihan step no longer says the definition is appended to the name. The
     definition is a separate element now.

  A note about the four unnamed controls (D3) is added to the Naming section.

- [x] **S8. `ci: refresh the Unicode data monthly`**

  C9 unchanged. `.github/workflows/refresh-unicode-data.yml` runs on the first
  of the month and on `workflow_dispatch`. The job is skipped unless the owner
  is `t-mart`, so a fork never commits to itself.

  `scripts/check-version.ts` reads `unicodeVersion` from the manifest, calls
  `fetchLatestVersion` from the generator, and writes `latest` and `stale` to
  `$GITHUB_OUTPUT`. The §3.2 regex stays in one place. Every later step is
  guarded by `stale == 'true'`, so a run on a current version does nothing.

  The comparison cannot be replaced by "generate, then look for a diff". The
  manifest carries a `generated` date, so every run would report a change.

  A refresh runs `pnpm gen-data`, then `pnpm test`, and only then commits. A
  broken generator fails the run and commits nothing. `git add --all` on
  `public/data` and `src/data` records the chunk files that a new version
  deletes.

- [ ] **S9. `docs: write the README`**

  The rest of C16. Describe the tool, the build, the data generation, and the
  refresh workflow. Delete the scaffold README text.

## 5. Open items

1. ~~TypeScript 7 upgrade.~~ Closed by decision 10.
2. ~~Definition chunk granularity.~~ Closed. Both layers use 4096. Revisit only
   with a measurement that shows a real cost.
3. **Should a lone surrogate get a name?** One can arrive from a damaged
   `?text=` parameter. Today it resolves to `High Surrogates` or
   `Low Surrogates` from the block table. That is defensible.
4. ~~`/about` is not in the HTML source.~~ Closed. Measured after S7: the
   prerender writes the full prose into `about/index.html`. Only `/` is a shell,
   because the SPA shell writes to `index.html`.

## 6. Verification commands

```
pnpm typecheck
pnpm check
pnpm test
pnpm gen-data
pnpm build
node scripts/check-version.ts
```
