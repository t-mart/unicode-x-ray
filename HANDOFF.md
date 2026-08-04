# Handoff: unicode-x-ray review and rework plan

Status: no code changed yet. This document records a review and an agreed plan.

Original project: /home/tim/code/unicode-x-ray

Work through the commits in order. Consult the original project for
implementation, but new work should land only here. Each commit is independent
and shippable. Keep the application in a working state after each commit.

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
3. **Extended grapheme clusters are not aksharas.** Indic and Southeast Asian
   text breaks at virama joins. This is correct UAX #29 behaviour. The About
   page text contradicts it (D15).

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
7. **Split name from definition on disk.** Chunk both by `codepoint >> 12`.

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

### 3.3 Target data layout

```
public/data/manifest.json      version, chunk size, chunk index
public/data/blocks.json        346 range rows, 3.5 KB brotli, bundle inline
public/data/names/0.json       names, run-length encoded, key = cp >> 12
public/data/names/1.json
...
public/data/defs/4E.json       Unihan definitions, key = cp >> 12
```

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

---

## 4. Commit plan

Message format: `[area]: [short line describing the main effect]`. Do not add
co-author trailers.

---

### C1. `names: return a placeholder instead of a throw`

**Why.** D1 is the worst defect. One unnamed code point blanks the whole page.
Today 4,807 assigned code points trigger it.

**Do.**

- Change `lookupNamesAction` to return a placeholder string when `getName`
  returns null. Do not throw.
- Delete `console.log(names)` (D9).
- Delete the `if (codepoint in names)` guard (D8). It never fires.
- Add a `.catch` to the `lookupNamesAction(...)` call in `app/page.tsx` (D1).

**Do not.** Do not add block names yet. C7 does that. Use a plain `<unknown>`
string for now.

**Done when.** Input of `U+0080` or an unassigned code point still shows names
for every other code point in the string.

---

### C2. `api: delete the unused names route`

**Why.** D5 and D4. The route is dead and it carries a duplicate 3.4 MB file.

**Do.**

- Delete `app/api/names/[codepoint]/`, including its `names.json`.
- Confirm with a grep that nothing references `api/names`.

**Done when.** The repository is 3.4 MB smaller and the build passes.

---

### C3. `gen-data: detect and record the Unicode version`

**Why.** Decision 3. The version drives both the refresh check and the
interface.

**Do.**

- Add a function that fetches `ReadMe.txt` and applies the regex in §3.2.
- Fail the run if the regex does not match. Do not guess a version.
- Change the download URLs to pin the detected version. Use
  `https://www.unicode.org/Public/UCD/<version>/ucd/...` instead of `latest`, so
  that one run cannot mix two versions.
- Write the version into the output.
- Accept an output directory argument, not a file path. Fix D6: point the
  `gen-data` script in `package.json` at the real destination.

**Done when.** A run prints the detected version and writes it to the output.

---

### C4. `gen-data: separate the name from the definition`

**Why.** D7. The fused format cannot be parsed back. §2.6 proves it.

**Do.**

- Stop the `` `${name} (${definition})` `` concatenation.
- Build two maps: names, and Unihan definitions.
- Fix D3 in the same pass. When a `Cc` code point has an empty Unicode 1.0 name,
  keep the code point and mark it for the unknown fallback. Do not emit an empty
  string, because `rangeTrieify` drops falsy names.
- Update `scripts/gen-data/README.md` to match the code (D13).

**Done when.** The two layers are separate, and the CJK ideograph range
collapses to a small number of name nodes. See §2.5.

---

### C5. `gen-data: name large uniform ranges from the block table`

**Why.** Decision 4 and §3.1.

**Do.**

- Download and parse `Blocks.txt`. Emit it as `blocks.json`.
- Stop the per code point expansion of `<..., First>` and `<..., Last>` rows for
  surrogates and private use. Emit one range node each.
- Use the canonical block name for those ranges.
- Keep the expansion for ranges that `DerivedName.txt` refines, such as Hangul
  syllables and CJK ideographs. Those need per code point names.

**Done when.** No non-uppercase names remain except the block names, and the
generator holds far fewer map entries.

---

### C6. `gen-data: emit chunked data files and a manifest`

**Why.** Decision 7. §2.5 gives the sizes.

**Do.**

- Emit the layout in §3.3. Use `chunkBits = 12`.
- Write the manifest last, so that a failed run does not leave a manifest that
  claims chunks exist.
- List only non-empty chunks in the manifest.
- Emit `.br` and `.gz` siblings for each chunk. Brotli quality 11 is too slow to
  run per request, so precompress at build time. Vercel compresses static assets
  by itself, but a self-hosted server needs the files.

**Done when.** 82 name chunks exist, none larger than about 22 KB brotli, and
the manifest reports version 17.0.0.

---

### C7. `lib: add chunk lookup and the unknown fallback`

**Why.** The lookup must find the chunk before it searches within it.

**Do.**

- Rename `lib/trie.ts`. It is a sorted range array, not a trie. `lib/names.ts`
  is accurate.
- Keep `getName` as the within-chunk binary search. It is correct.
- Add a chunk loader with a pluggable fetch function. The server action uses a
  file reader now. The browser uses `fetch` after C12. This seam avoids a
  rewrite at migration time.
- Add the block lookup and the `<unknown, Block Name>` fallback (decision 2).
  Return `<unknown>` when no block matches.
- Replace the C1 placeholder with this fallback.

**Done when.** `U+11B60` shows `<unknown, ...>` with the correct block name, and
`U+0041` shows `LATIN CAPITAL LETTER A`.

---

### C8. `app: read names and definitions from the chunked data`

**Why.** Connects the new data to the running application.

**Do.**

- Point the server action at the chunk loader.
- Show the definition as a separate element from the name, not as text inside
  it.
- Fetch a definition chunk only when a code point in that chunk has one. The
  manifest `defChunks` list makes this a cheap check.
- Show the Unicode version from the manifest somewhere in the layout (decision
  3).

**Note.** The server action is temporary. C12 deletes it. The chunk logic lives
in `lib/`, so only about 20 lines are discarded.

**Done when.** CJK input shows a name and a definition, and the version appears
in the interface.

---

### C9. `ci: add a workflow to refresh the Unicode data`

**Why.** D2 returns every September without automation.

**Do.**

- Add `.github/workflows/refresh-unicode-data.yml`.
- Triggers: `workflow_dispatch`, and `schedule` on a monthly cron.
- Set `permissions: contents: write`.
- Steps: check out, set up Node, read `unicodeVersion` from the committed
  manifest, fetch the latest version per §3.2, and compare.
- Stop with success if the two versions match. Do not commit.
- Run the generator and commit the output if the versions differ.
- Use commit message `data: update to Unicode <version>`.
- Guard the job so that it does not run on forks.

**Done when.** A manual run on current data exits without a commit, and a run
with an edited manifest version produces a commit.

---

### C10. `build: add Vite beside Next`

**Why.** Decision 5. Add the new build before the old one is removed, so that
the repository always builds.

**Do.**

- Add `vite@8`, `@vitejs/plugin-react@6`, `@tailwindcss/vite@4.3`.
- Add `index.html` and a React entry point.
- Migrate Tailwind 3 to Tailwind 4. Replace `tailwind.config.ts` with an
  `@theme` block in the CSS. Replace `@tailwind base/components/utilities` with
  `@import "tailwindcss"`.
- Drop `@tailwindcss/typography` (D14) and `tailwindcss-animate`. Delete
  `postcss.config.mjs`.
- Convert the shadcn HSL triplet variables to real color values.

**Done when.** `vite build` produces a static bundle. Next still builds too.

---

### C11. `ui: replace the Radix and shadcn components`

**Why.** Decision 6.

**Do.**

- `Label` becomes `<label>`. The input has a real `id`.
- `Input` becomes `<input>` with classes.
- `Skeleton` becomes a `div` with `animate-pulse`.
- `Select` becomes a native `<select>`. Five options need no custom widget.
  Native gives keyboard, mobile, and screen reader behaviour at no cost.
- `Popover` goes away. It exists only because `line-clamp-3` truncates long
  names, and the long names are the ones with definitions. C8 already moved the
  definition to its own element. Change the card layout so long text has room,
  then delete the interaction.
- Remove `@radix-ui/*`, `class-variance-authority`, and `tailwind-merge`.
- Inline the two Lucide icons (`RefreshCw`, `ArrowLeft`) and remove
  `lucide-react`.
- Delete `components/ui/` and `components.json`.

**Done when.** No Radix package remains and every control still works with a
keyboard.

---

### C12. `app: port routing and fetch chunks in the browser`

**Why.** Removes the last Next-specific runtime code.

**Do.**

- Add `react-router@8`. Use declarative mode. There is no framework mode, no
  loaders, and no server. `react-router-dom` no longer exists as a package.
- Replace `next/link` with the router link.
- Replace `useSearchParams` and `useRouter` with `URLSearchParams` and the
  History API.
- Replace `next/script` for Plausible with a plain script tag in `index.html`.
  Correct the `NEXT_PUBLIC_PLAUSIBLE_DOMIAN` spelling while renaming the
  variables.
- Delete `actions/names.ts` and its JSON. Point the C7 chunk loader at `fetch`.
- Bundle chunk `0` and `blocks.json` into the JavaScript, so that the first
  keystroke needs no network round trip.
- Fix D10, D11, and D12 in this pass, because all three sit in the code being
  moved:
  - Copy the examples array before the shuffle. Use Fisher-Yates.
  - Remove or explain the `router.push("/")` on mount.
  - Read the name straight from context during render. Delete the state and the
    effect, and the `eslint-disable` with them.
- Pass an explicit locale to `Intl.Segmenter` (§2.4 item 2).

**Done when.** The Vite build runs the whole application with no server, and a
shared `?text=` link still works.

---

### C13. `build: remove Next`

**Do.**

- Remove `next`, `eslint-config-next`, and `next-env.d.ts`.
- Add `eslint-plugin-react-hooks` directly. `eslint-config-next` supplied it,
  and two disable comments depend on the rule.
- Move `app/` to `src/`.
- Add a Vercel static build configuration.
- Confirm the build serves correctly from a plain file server.

**Done when.** No Next package remains and both deploy paths work.

---

### C14. `build: update the TypeScript config and dependencies`

**Do.**

- Application config: `module: preserve`, `moduleResolution: bundler`,
  `target: es2022`, `lib: ["es2025", "dom", "dom.iterable"]`, `jsx: react-jsx`,
  `noEmit`, `verbatimModuleSyntax`, `moduleDetection: force`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `erasableSyntaxOnly`.
- `lib` must include ES2025 because of `Set.prototype.difference` (D16).
- `noUncheckedIndexedAccess` makes `trie[mid]` possibly undefined. Handle it.
  This is the one place where an off-by-one gives a wrong name instead of a
  crash.
- Scripts config: `module: nodenext`, `moduleResolution: nodenext`.
- Consider removal of `tsx`. Node 26 runs TypeScript directly by type stripping.
  The generator uses no enums, namespaces, or parameter properties, so it is
  erasable. Native stripping does not resolve the `@/` alias. Change the import
  to a `#` subpath in `package.json` or to a relative path, and add explicit
  `.ts` extensions.
- Upgrade: `react` and `react-dom` to 19.2, `eslint` to 10, `typescript-eslint`
  to 8.66.
- Keep `yauzl-promise`. Node still has no zip reader.
- Add `.gitattributes` with `* text=auto eol=lf` (D17).

**Ask the user first.** TypeScript 7.0.2 is the native Go compiler. It is fast
and current, but it is young. Confirm before the upgrade from 5.7.

---

### C15. `test: cover the name table and segmentation`

**Why.** There are no tests. The pure functions are the cheap targets, and a
property test catches the class of defect in D1 and D3.

**Do.**

- Add `vitest@4`.
- Round trip test: build a map, encode it, and assert that every code point
  reads back the same name.
- Property test: assert that no assigned code point in the source data returns
  null. This is the guard for D1 and D3.
- Boundary tests for the binary search: first node, last node, a gap between
  ranges, a code point below the first node, and a code point above the last.
- Chunk test: assert that a code point resolves the same through the chunk
  loader as through a single table.
- Segmentation tests: an emoji ZWJ sequence, a regional indicator pair, a
  combining sequence, and a lone surrogate.

---

### C16. `docs: rewrite the README and correct the About page`

**Do.**

- Replace the `create-next-app` README. Describe the tool, the build, the data
  generation, and the refresh workflow.
- Correct the About page grapheme claim (D15). Extended grapheme clusters are
  not the units that a reader of Devanagari perceives. The application already
  shows नमस्ते, မင်္ဂလာပါ, ꦱꦸꦒꦼꦁꦱꦶꦪꦁ, and สวัสดี as examples, so the page
  contradicts itself. Explain the difference. It is the most interesting thing
  the tool teaches.
- Document the version skew: the browser supplies segmentation, the data file
  supplies names, and the two versions can differ.
- Update the naming section for the split of name and definition, and for the
  block-derived names.

---

## 5. Open items

1. **TypeScript 7 upgrade.** See C14. Needs a decision.
2. **Definition chunk granularity.** 4096 is chosen for names. Definitions are
   sparse and cluster in the Han blocks. A finer split serves a two-character
   input better. Measure before a change.
3. **Should a lone surrogate get a name?** One can arrive from a damaged
   `?text=` parameter. Today it resolves to a block name. That is defensible.

## 6. Verification commands

```
npx tsc --noEmit
npx vitest run
npm run gen-data
npx vite build
```
