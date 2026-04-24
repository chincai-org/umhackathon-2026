import type { APIRoute } from "astro";
import { getDieselSignal } from "../../lib/fuelprice";

type RecommendationPayload = {
	title?: string;
	severity?: "Low" | "Medium" | "High" | "Critical" | string;
	naturalLanguageRecommendation?: string;
	logicalRationale?: string;
	tradeoffAnalysis?: string;
	routingOptimization?: string;
	resourceAllocation?: unknown;
};

function parseAiJson(content: string): RecommendationPayload | null {
	const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
	try {
		return JSON.parse(cleaned) as RecommendationPayload;
	} catch {
		return null;
	}
}

export const POST: APIRoute = async () => {
	const apiKey = String(import.meta.env.ILMU_API_KEY ?? "").trim();
	if (!apiKey) {
		return new Response(JSON.stringify({ ok: false, error: "Missing ILMU_API_KEY in .env" }), { status: 500 });
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

		// INSERT DATA HERE
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
			utilization: { average: `${averageUtilization}%`, byHub: hubSnapshot.map((hub) => `${hub.hub}: ${hub.utilization}%`) },
		};

		const requestPayload = {
			model: "ilmu-glm-5.1",
			messages: [
				{
					role: "system",
					content:
						"You are a logistics optimization AI. Return only valid JSON with keys: title, severity, naturalLanguageRecommendation, logicalRationale, tradeoffAnalysis, routingOptimization, resourceAllocation. Severity must be one of Low, Medium, High, Critical.",
				},
				{
					role: "user",
					content: `Generate prescriptive recommendation from fused logistics data:\n${JSON.stringify(fusedContext, null, 2)}`,
				},
			],
		};

		const requestBody = JSON.stringify(requestPayload);
		const requestUrl = "https://api.ilmu.ai/v1/chat/completions";

		const callAi = async (attemptLabel: string) => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 100000);
			try {
				const response = await fetch(requestUrl, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey}`,
						"Content-Type": "application/json",
					},
					body: requestBody,
					signal: controller.signal,
				});

				const rawText = await response.text();
				let data: any = null;
				try {
					data = rawText ? JSON.parse(rawText) : null;
				} catch {
					data = null;
				}

				if (!response.ok) {
					const providerMessage =
						data?.error?.message ??
						data?.message ??
						(rawText ? rawText.slice(0, 250) : "No provider error body");

					if (response.status === 401) {
						throw new Error(
							`AI API HTTP 401: ${providerMessage}. Verify ILMU_API_KEY is valid and has access/quota for ilmu-glm-5.1.`,
						);
					}
					if (response.status === 504) {
						throw new Error(
							`AI API HTTP 504 (${attemptLabel}): Provider gateway timed out before model completion. ${providerMessage}`,
						);
					}
					throw new Error(`AI API HTTP ${response.status} (${attemptLabel}): ${providerMessage}`);
				}

				return data;
			} catch (error) {
				console.log("[Z.AI] Error", error);
				if (error instanceof Error && error.name === "AbortError") {
					throw new Error(`AI request timeout (${attemptLabel}): no response in 100s`);
				}
				throw error;
			} finally {
				clearTimeout(timeoutId);
			}
		};

		const data = await callAi("attempt 1");

		const aiRawText = data?.choices?.[0]?.message?.content?.trim() ?? "";
		if (!aiRawText) {
			throw new Error("AI returned an empty completion payload");
		}

		const parsed = parseAiJson(aiRawText);
		if (!parsed) {
			return new Response(
				JSON.stringify({
					ok: true,
					result: {
						title: "AI response",
						severity: "Medium",
						naturalLanguageRecommendation: aiRawText,
						logicalRationale: "Provider returned plain text instead of structured JSON.",
						tradeoffAnalysis: "N/A",
						routingOptimization: "N/A",
						resourceAllocation: [],
					},
					raw: aiRawText,
				}),
				{ status: 200 },
			);
		}

		return new Response(JSON.stringify({ ok: true, result: parsed, raw: aiRawText }), {
			status: 200,
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				ok: false,
				error: error instanceof Error ? error.message : "Failed to generate recommendation",
			}),
			{ status: 500 },
		);
	}
};
