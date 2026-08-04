import { manifest } from "../lib/unicode.ts";

export default function Footer() {
	return (
		<footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
			<div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
				<p className="m-0 text-sm">
					Unicode {manifest.unicodeVersion} data, generated {manifest.generated}
					.
				</p>
				<p className="m-0 text-sm">
					<a
						href="https://www.unicode.org/Public/UCD/latest/"
						target="_blank"
						rel="noreferrer"
					>
						Unicode Character Database
					</a>
				</p>
			</div>
		</footer>
	);
}
