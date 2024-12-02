import namesTrie from "./names.json";
import { getName, type RangeTrieNode } from "@/lib/trie";

export const dynamic = "force-static";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codepoint: string }> }
) {
  const { codepoint } = await params;

  // get the name from the trie
  const name = getName(parseInt(codepoint, 16), namesTrie as RangeTrieNode[]);

  if (!name) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json({ name });
}
