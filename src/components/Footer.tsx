import { manifest } from "../lib/unicode.ts";

export default function Footer() {
	return (
		<footer>
			<ul>
				<li>
					Unicode {manifest.unicodeVersion} data, generated{" "}
					<time dateTime={manifest.generated}>{manifest.generated}</time>
				</li>
				<li>Site by Tim Martin</li>
				<li>
					<a
						href="https://github.com/t-mart/unicode-x-ray"
						target="_blank"
						rel="noreferrer"
					>
						Project Source
					</a>
				</li>
			</ul>
		</footer>
	);
}
