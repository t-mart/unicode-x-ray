# Unicode X-Ray

Unicode X-Ray shows what text is made of.

Paste text into the box. The tool breaks the text into grapheme clusters, then
breaks each cluster into code points. Each code point shows its number, its
character, and its name. Some characters also show a definition.

Use it to find a hidden character, to see how an emoji is built, or to read the
name of a character you do not recognize.

The `/about` page explains grapheme clusters, code points, normalization, and
where the names come from.

## Requirements

- Node 26 or later
- pnpm

## Develop

```sh
pnpm install
pnpm dev
```

The dev server listens on port 3000.

## Build

```sh
pnpm build
```

The build writes static files to `.output/public`. Serve that directory with any
file server. The application runs in the browser and fetches its data over HTTP.
No server code is necessary.

## Check the work

| Command          | Effect                                     |
| ---------------- | ------------------------------------------ |
| `pnpm typecheck` | Type check the project                     |
| `pnpm check`     | Report lint and format problems with Biome |
| `pnpm test`      | Run the tests once                         |

## The data

Names come from the Unicode Character Database (UCD). `pnpm gen-data` downloads
the UCD, builds a name for every code point, and writes JSON files. Downloads
are cached in `node_modules/.cache/ucd`.

The generator reads six files. `UnicodeData.txt` and `DerivedName.txt` supply
the names. `NameAliases.txt` corrects a wrong name and names the C1 controls.
`Blocks.txt` supplies the block names. `Unihan.zip` supplies a definition for
each CJK ideograph, and `Unikemet.txt` supplies a description for each Egyptian
hieroglyph. The `/about` page gives the order of precedence.

The output is in two places:

- `src/data` holds `manifest.json` and `blocks.json`. The build bundles both
  into the application, because every page needs them.
- `public/data` holds the names and the definitions, cut into chunks of 4096
  code points. The browser fetches only the chunks that the text on screen
  needs. The whole table is 3.5 MB. Latin text needs one chunk of 126 KB, or
  18 KB after compression.

Both directories are committed, so a build needs no network access.

## Monthly refresh

The `Refresh Unicode data` workflow runs on the first day of each month. It
compares the version in `src/data/manifest.json` against the version that the
UCD publishes. The two versions usually agree, and the workflow stops.

When the versions differ, the workflow runs `pnpm gen-data`, runs the tests, and
commits the result as `data: update to Unicode <version>`. A failed test stops
the commit.

To force a refresh, start the workflow by hand from the Actions tab.

To do the same work locally, run `pnpm gen-data`, then commit `src/data` and
`public/data`.
