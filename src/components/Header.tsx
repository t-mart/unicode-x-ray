import { Link } from "@tanstack/react-router";
import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-line border-b bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-ink no-underline hover:text-accent"
        >
          <Logo className="size-7" />
          <span className="font-semibold tracking-tight">Unicode X-Ray</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-5 text-sm">
            <li>
              <Link
                to="/about"
                className="text-ink-dim no-underline hover:text-ink aria-[current=page]:text-ink"
              >
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
