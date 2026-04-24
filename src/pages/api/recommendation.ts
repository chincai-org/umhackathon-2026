import type { APIRoute } from "astro";
import { getDieselSignal } from "../../lib/fuelprice";
import { callRecommendationProvider } from "../../lib/recommendation-provider";
import { fallbackRecommendation, parseRecommendationJson } from "../../lib/recommendation";

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

export const POST: APIRoute = async () => {
	const apiKey = String(import.meta.env.ILMU_API_KEY ?? "").trim();
	if (!apiKey) {
		return jsonResponse({ ok: false, error: "Missing ILMU_API_KEY in .env" }, 500);
	}

	try {
		const { dieselLabel, dieselNote, dieselHoverNote } = await getDieselSignal();
		const hubSnapshot = [
			{ hub: "Hub A", packages24h: 1200, trucks: 18, utilization: 82, note: "Normal load" },
			{ hub: "Hub B", packages24h: 860, trucks: 12, utilization: 64, note: "Under capacity" },
		];

		const averageUtilization = Math.round(
			hubSnapshot.reduce((total, hub) => total + hub.utilization, 0) / hubSnapshot.length,
		);

		const fusedContext = {
			fuel: { price: dieselLabel, note: dieselNote, trend: dieselHoverNote },
			weather: "East coast rainfall likely to delay several delivery windows.",
			signals: [
				"Fuel pricing trend indicates elevated cost pressure.",
				"Port congestion still visible on inbound replenishment.",
				"Weekend demand lift expected in urban zones.",
			],
			hubs: hubSnapshot,
			truckAllocation: "Hub A: 18 trucks, Hub B: 12 trucks",
			utilization: {
				average: `${averageUtilization}%`,
				byHub: hubSnapshot.map((hub) => `${hub.hub}: ${hub.utilization}%`),
			},
		};

		const aiRawText = await callRecommendationProvider(apiKey, fusedContext, "attempt 1");
		const parsed = parseRecommendationJson(aiRawText);

		if (!parsed) {
			return jsonResponse({ ok: true, result: fallbackRecommendation(aiRawText), raw: aiRawText });
		}

		return jsonResponse({ ok: true, result: parsed, raw: aiRawText });
	} catch (error) {
		return jsonResponse(
			{
				ok: false,
				error: error instanceof Error ? error.message : "Failed to generate recommendation",
			},
			500,
		);
	}
};
