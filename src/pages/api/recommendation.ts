import type { APIRoute } from "astro";
import { generateRecommendation } from "../../lib/recommendation-service";

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

export const POST: APIRoute = async () => {
	const apiKey = String(import.meta.env.ILMU_API_KEY ?? "").trim();
	if (!apiKey) {
		return jsonResponse(
			{ ok: false, error: "Missing ILMU_API_KEY in .env" },
			500,
		);
	}

	try {
		const { result, raw } = await generateRecommendation(apiKey);
		return jsonResponse({ ok: true, result, raw });
	} catch (error) {
		return jsonResponse(
			{
				ok: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate recommendation",
			},
			500,
		);
	}
};
