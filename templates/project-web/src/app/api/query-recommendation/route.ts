import { env } from "@/lib/server/env";
import {
  errorResponse,
  getSearchClient,
  requireFeature,
} from "@/lib/server/viking";

export async function POST() {
  const unavailable = requireFeature("search");
  if (unavailable) return unavailable;

  try {
    const result = await getSearchClient().queryRecommendation({
      application: env.appId,
      scene_id: env.searchSceneId,
      dataset_id: env.searchDatasetId,
      user: { _user_id: "template-user" },
      page_size: 10,
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
