import { getPublicHousingNoticeFeed } from "@/lib/housing/public-notices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Keep this route dynamic so an unavailable upstream response cannot remain
  // as the deployed API response. The upstream LH fetch itself is cached server-side.
  const regions = new URL(request.url).searchParams.getAll("region");
  const feed = await getPublicHousingNoticeFeed({ regions });
  return Response.json(feed, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
