import { manifest } from "../lib/unicode.ts";

export default function Footer() {
	return (
		<footer>
			<p>
				Unicode {manifest.unicodeVersion} data, generated {manifest.generated}.{" "}
				<a
					href="https://www.unicode.org/Public/UCD/latest/"
					target="_blank"
					rel="noreferrer"
				>
					Unicode Character Database
				</a>
			</p>
		</footer>
	);
}
