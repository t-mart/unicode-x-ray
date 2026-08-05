import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header>
      <Link to="/">
        <img src="/favicon.svg" alt="" width={32} height={32} />
        <span>Unicode X-Ray</span>
      </Link>
      <nav aria-label="Main">
        <ul>
          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
