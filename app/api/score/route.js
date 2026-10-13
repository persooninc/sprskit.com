import { computeScore } from "../../../lib/score";

export async function GET(request) {
  const url = new URL(request.url);
  const result = computeScore({
    unmet5: url.searchParams.get("unmet5") ?? "",
    unmet3: url.searchParams.get("unmet3") ?? "",
    unmet1: url.searchParams.get("unmet1") ?? "",
  });
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
