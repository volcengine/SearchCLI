import { env } from "@/lib/server/env";
import {
  errorResponse,
  getSearchClient,
  requireFeature,
} from "@/lib/server/viking";

const PAGE_SIZE = 10;

type SearchBody = {
  query?: unknown;
  image?: { base64?: unknown };
  page?: unknown;
};

export async function POST(request: Request) {
  const unavailable = requireFeature("search");
  if (unavailable) return unavailable;

  try {
    const body = (await request.json()) as SearchBody;
    const query = String(body.query ?? "").trim();
    const image =
      typeof body.image?.base64 === "string"
        ? body.image.base64
        : undefined;
    const page = Math.max(1, Number(body.page) || 1);

    if (!query && !image) {
      return Response.json(
        { error: "Missing query or image." },
        { status: 400 },
      );
    }

    const result = await getSearchClient().search({
      application: env.appId,
      scene_id: env.searchSceneId,
      dataset_id: env.searchDatasetId,
      query: {
        ...(query ? { text: query } : {}),
        ...(image
          ? {
              image_url: image,
              ...(query ? { image_query_instruction: query } : {}),
            }
          : {}),
      },
      page_number: page,
      page_size: PAGE_SIZE,
    });

    const totalItems = Number.isFinite(result.total_items)
      ? result.total_items
      : undefined;
    const totalPages =
      typeof totalItems === "number"
        ? Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
        : undefined;
    const resultCount = result.search_results?.length ?? 0;

    return Response.json({
      ...result,
      page,
      page_size: PAGE_SIZE,
      total_pages: totalPages,
      has_more:
        typeof totalPages === "number"
          ? page < totalPages
          : resultCount === PAGE_SIZE,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    return errorResponse(error);
  }
}
