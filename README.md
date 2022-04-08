# Unicode X-Ray

**[Live website](https://unicode-x-ray.vercel.app/)**

Take a closer look at Unicode:

- Splits text into [graphemes](https://unicode.org/reports/tr29/#Grapheme_Cluster_Boundaries), which
  may be a sequence of codepoints.
- Displays a name for each character
- [Normalizes](https://unicode.org/reports/tr15/#Introduction) text into different forms

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
