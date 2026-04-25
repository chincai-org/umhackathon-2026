import { describe, expect, test } from "bun:test";
import { buildRequestPayload } from "./recommendation-provider";
import { parseRecommendationJson } from "./recommendation";

describe("parseRecommendationJson", () => {
	test("parses fenced JSON", () => {
		const payload = parseRecommendationJson(`
\`\`\`json
{
	"title": "Route shift",
	"severity": "High",
	"naturalLanguageRecommendation": "Move trucks now",
	"logicalRationale": "Demand spike",
	"tradeoffAnalysis": "Higher cost, lower delay",
	"routingOptimization": "Use northern corridor",
	"resourceAllocation": ["Move 2 trucks"]
}
\`\`\`
`);

		expect(payload).toBeTruthy();
		expect(payload?.severity).toBe("High");
		expect(payload?.resourceAllocation).toEqual(["Move 2 trucks"]);
	});

	test("returns null for malformed json", () => {
		expect(parseRecommendationJson("not json")).toBeNull();
	});

	test("rejects malformed resource allocation", () => {
		const payload = parseRecommendationJson(
			JSON.stringify({
				title: "Route shift",
				severity: "High",
				naturalLanguageRecommendation: "Move trucks now",
				logicalRationale: "Demand spike",
				tradeoffAnalysis: "Higher cost, lower delay",
				routingOptimization: "Use northern corridor",
				resourceAllocation: { hubA: 2 },
			}),
		);

		expect(payload).toBeNull();
	});
});

describe("buildRequestPayload", () => {
	test("compiles prompt with expected schema and user context", () => {
		const fusedContext = {
			fuel: { price: "RM2.50 / L" },
			hubs: [{ hub: "Hub A", utilization: 82 }],
		};

		const payload = buildRequestPayload(fusedContext);

		expect(payload.model).toBe("ilmu-glm-5.1");
		expect(payload.messages).toHaveLength(2);
		expect(payload.messages[0].role).toBe("system");
		expect(payload.messages[0].content).toContain(
			"resourceAllocation: string[]",
		);
		expect(payload.messages[1].role).toBe("user");
		expect(payload.messages[1].content).toContain('"fuel"');
		expect(payload.messages[1].content).toContain('\n   "fuel"');
	});
});
