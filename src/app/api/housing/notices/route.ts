import { getPublicHousingNoticeFeed } from "@/lib/housing/public-notices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Keep this route dynamic so a fixture response made before key configuration
  // cannot remain as the deployed API response. The upstream LH fetch itself is cached server-side.
  const region = new URL(request.url).searchParams.get("region") ?? undefined;
  const feed = await getPublicHousingNoticeFeed({ region });
  return Response.json(feed, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
