import type { Metadata } from "next";
import "./globals.css";
import Plausible from "./_components/plausible";

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
        {children}
      </body>
    </html>
  );
}
