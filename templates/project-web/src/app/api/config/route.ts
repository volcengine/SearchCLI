import { env } from "@/lib/server/env";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ features: env.features });
}
