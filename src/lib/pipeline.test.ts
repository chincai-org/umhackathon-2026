import { describe, expect, test } from "bun:test";
import { buildApiUrl } from "../../news";
import {
	fallbackRecommendation,
	AiResponseSchema,
	ProviderErrorSchema,
} from "./recommendation";
import { computeWeather } from "./weather";

describe("buildApiUrl", () => {
	test("includes keyword, limit, and date range", () => {
		const url = buildApiUrl("flood", 7, new Date("2026-04-25T00:00:00.000Z"));

		expect(url).toContain("keywords=flood");
		expect(url).toContain("limit=7");
		expect(url).toContain("date=2026-03-01%2C2026-04-25");
	});
});

describe("computeWeather", () => {
	test("detects storm risk", () => {
		expect(
			computeWeather({
				current: { precipitation: 6, wind_speed_10m: 40 },
				hourly: { precipitation_probability: [70], visibility: [5000] },
			}).risk,
		).toBe("HIGH");
	});

	test("detects low visibility", () => {
		expect(
			computeWeather({
				current: { precipitation: 0, wind_speed_10m: 2 },
				hourly: { precipitation_probability: [10], visibility: [1000] },
			}).condition,
		).toBe("🌫 Low Visibility");
	});

	test("detects stable conditions", () => {
		expect(
			computeWeather({
				current: { precipitation: 0, wind_speed_10m: 2 },
				hourly: {
					precipitation_probability: [10],
					visibility: [10000],
				},
			}).risk,
		).toBe("LOW");
	});
});

describe("recommendation schemas", () => {
	test("AiResponseSchema rejects empty content", () => {
		expect(
			AiResponseSchema.safeParse({
				choices: [{ message: { content: "" } }],
			}).success,
		).toBe(false);
	});

	test("ProviderErrorSchema reads provider messages", () => {
		const parsed = ProviderErrorSchema.safeParse({
			error: { message: "quota exceeded" },
		});
		if (!parsed.success)
			throw new Error("Expected provider error schema to parse");
		expect(parsed.data.error?.message).toBe("quota exceeded");
	});

	test("fallbackRecommendation returns structured payload", () => {
		const payload = fallbackRecommendation("plain text");
		expect(payload.resourceAllocation).toEqual([]);
		expect(payload.severity).toBe("Medium");
		expect(payload.naturalLanguageRecommendation).toBe("plain text");
	});
});
