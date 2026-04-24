import { z } from "zod";

export const RecommendationSchema = z.strictObject({
	title: z.string().min(1),
	severity: z.enum(["Low", "Medium", "High", "Critical"]),
	naturalLanguageRecommendation: z.string().min(1),
	logicalRationale: z.string().min(1),
	tradeoffAnalysis: z.string().min(1),
	routingOptimization: z.string().min(1),
	resourceAllocation: z.unknown(),
});

export type RecommendationPayload = z.infer<typeof RecommendationSchema>;

export const AiResponseSchema = z.object({
	choices: z.array(
		z.looseObject({
			message: z.looseObject({
				content: z.string().min(1),
			}),
		}),
	),
});

export const ProviderErrorSchema = z
	.object({
		error: z
			.object({
				message: z.string().optional(),
			})
			.optional(),
		message: z.string().optional(),
	})
	.passthrough();

export function parseRecommendationJson(
	content: string,
): RecommendationPayload | null {
	const cleaned = content
		.trim()
		.replace(/^```(?:json)?/i, "")
		.replace(/```$/, "")
		.trim();

	try {
		const rawJson = JSON.parse(cleaned);
		const result = RecommendationSchema.safeParse(rawJson);

		if (!result.success) {
			console.warn(
				"[Z.AI] Invalid recommendation JSON",
				result.error.issues,
			);
			return null;
		}

		return result.data;
	} catch {
		return null;
	}
}

export function fallbackRecommendation(
	aiRawText: string,
): RecommendationPayload {
	return {
		title: "AI response",
		severity: "Medium",
		naturalLanguageRecommendation: aiRawText,
		logicalRationale:
			"Provider returned plain text instead of structured JSON.",
		tradeoffAnalysis: "N/A",
		routingOptimization: "N/A",
		resourceAllocation: [],
	};
}
