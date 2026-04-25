import { getDieselSignal } from "./fuelprice";
import { callRecommendationProvider } from "./recommendation-provider";
import { fallbackRecommendation, parseRecommendationJson, type RecommendationPayload } from "./recommendation";
import { getRegionalWeatherSafe } from "./weather";

export async function buildFusedContext() {
	const [diesel, regionalWeather] = await Promise.all([
		getDieselSignal(),
		getRegionalWeatherSafe(),
	]);

	const weatherSummary = Object.values(regionalWeather)
		.map((zone) => `${zone.name}: ${zone.condition} (${zone.risk})`)
		.join("; ");
	const hubSnapshot = [
		{ hub: "Hub A", packages24h: 1200, trucks: 18, utilization: 82, note: "Normal load" },
		{ hub: "Hub B", packages24h: 860, trucks: 12, utilization: 64, note: "Under capacity" },
	];

	const averageUtilization = Math.round(
		hubSnapshot.reduce((total, hub) => total + hub.utilization, 0) / hubSnapshot.length,
	);

	return {
		fusedContext: {
			fuel: {
				price: diesel.dieselLabel,
				note: diesel.dieselNote,
				trend: diesel.dieselHoverNote,
			},
			weather: {
				summary: weatherSummary,
				byZone: regionalWeather,
			},
			signals: [
				"Fuel pricing trend indicates elevated cost pressure.",
				`Weather update: ${weatherSummary || "No weather summary available."}`,
				"Port congestion still visible on inbound replenishment.",
				"Weekend demand lift expected in urban zones.",
			],
			hubs: hubSnapshot,
			truckAllocation: "Hub A: 18 trucks, Hub B: 12 trucks",
			utilization: {
				average: `${averageUtilization}%`,
				byHub: hubSnapshot.map((hub) => `${hub.hub}: ${hub.utilization}%`),
			},
		},
		regionalWeather,
		diesel,
	};
}

export async function generateRecommendation(apiKey: string, attemptLabel = "attempt 1"): Promise<{ result: RecommendationPayload; raw: string }> {
	const { fusedContext } = await buildFusedContext();
	const aiRawText = await callRecommendationProvider(apiKey, fusedContext, attemptLabel);
	const parsed = parseRecommendationJson(aiRawText);

	return {
		result: parsed ?? fallbackRecommendation(aiRawText),
		raw: aiRawText,
	};
}
