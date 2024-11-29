import type { Metadata } from "next";
import "./globals.css";
import Plausible from "./_components/plausible";
import Link from "next/link";
import Logo from "@/components/logo";
import { H1 } from "@/components/typography";

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
        <div className="max-w-prose mx-auto p-6 space-y-4">
          <H1 className="flex items-center gap-2 flex-wrap">
            <Logo outerClassName="size-12 shrink-0" />{" "}
            <span>Unicode X-Ray</span>
          </H1>
          <main>{children}</main>
          <footer className="justify-center flex gap-4 mt-16 flex-wrap text-center">
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
