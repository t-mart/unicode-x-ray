import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unicode X-Ray - About",
};

export default function About() {
  return (
    <div>
      <Link href="/" className="link">
        <ArrowLeft className="size-4 inline mr-1" />
        Return to home
      </Link>
    </div>
  );
}
