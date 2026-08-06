import { manifest } from "../lib/unicode.ts";

export default function Footer() {
  return (
    <footer className="mt-16 border-line border-t">
      <ul className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-ink-faint text-sm">
        <li>
          Unicode {manifest.unicodeVersion} data, generated{" "}
          <time dateTime={manifest.generated} className="font-mono">
            {manifest.generated}
          </time>
        </li>
        <li>Site by Tim Martin</li>
        <li>
          <a
            href="https://github.com/t-mart/unicode-x-ray"
            target="_blank"
            rel="noreferrer"
            className="text-ink-dim no-underline hover:text-accent"
          >
            Project Source
          </a>
        </li>
      </ul>
    </footer>
  );
}
