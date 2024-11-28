import type { Metadata } from "next";
import "./globals.css";
import Plausible from "./_components/plausible";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unicode X-Ray",
  description:
    "Look inside your Unicode strings, breaking them down into graphemes and code points.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Plausible />
        <div className="container mx-auto p-6">
          <main>{children}</main>
          <footer className="justify-center flex gap-4 mt-16">
            <p>Tim Martin</p>
            <span className="select-none">&bull;</span>
            <p>
              <Link href="/about" className="link">
                About
              </Link>
            </p>
            <span className="select-none">&bull;</span>
            <p>
              <Link
                href="https://github.com/t-mart/unicode-x-ray"
                className="link"
              >
                Source
              </Link>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
