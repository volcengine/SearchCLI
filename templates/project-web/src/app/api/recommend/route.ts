import { env } from "@/lib/server/env";
import {
  errorResponse,
  getSearchClient,
  requireFeature,
} from "@/lib/server/viking";

export async function POST() {
  const unavailable = requireFeature("recommend");
  if (unavailable) return unavailable;

  try {
    const result = await getSearchClient().recommend({
      application: env.appId,
      scene_id: env.recSceneId,
      user: { _user_id: "template-user" },
      page_size: 20,
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
