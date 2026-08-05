import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header>
			<nav>
				<ul>
					<li>
						<Link to="/">Home</Link>
					</li>
					<li>
						<Link to="/about">About</Link>
					</li>
					<li>
						<a
							href="https://www.unicode.org/versions/latest/"
							target="_blank"
							rel="noreferrer"
						>
							The standard
						</a>
					</li>
				</ul>
			</nav>
		</header>
	);
}
