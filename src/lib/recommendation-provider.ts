import { AiResponseSchema, ProviderErrorSchema } from "./recommendation";

const requestUrl = "https://api.ilmu.ai/v1/chat/completions";

export function buildRequestPayload(fusedContext: unknown) {
	console.log(
		`Generate prescriptive recommendation from fused logistics data:\n${JSON.stringify(fusedContext, null, 3)}`,
	);
	return {
		model: "ilmu-glm-5.1",
		messages: [
			{
				role: "system",
				content: `You are a logistics optimization AI. Return ONLY valid JSON. Do not include any explanation, markdown, or extra text. Your JSON response must strictly conforms to the following Typescript schema:
				{
					title: string (min length 1),
					severity: "Low" | "Medium" | "High" | "Critical",
					naturalLanguageRecommendation: string (min length 1),
					logicalRationale: string (min length 1),
					tradeoffAnalysis: string (min length 1),
					routingOptimization: string (min length 1),
					resourceAllocation: string[]
				}
				Example output:
				{
					"title": "Sample",
					"severity": "High",
					"naturalLanguageRecommendation": "Do this instead",
					"logicalRationale": "great...",
					"tradeoffAnalysis": "the trade off is...",
					"routingOptimization": "route here to that instead",
          "resourceAllocation": [
            "Transfer 3 trucks from Hub B to Hub A",
            "Hub A: 21 trucks",
            "Hub B: 9 trucks"
          ]	}`,
			},
			{
				role: "user",
				content: `Generate prescriptive recommendation from fused logistics data:\n${JSON.stringify(fusedContext, null, 3)}`,
			},
		],
	};
}

export async function callRecommendationProvider(
	apiKey: string,
	fusedContext: unknown,
	attemptLabel: string,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 100000);

	try {
		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(buildRequestPayload(fusedContext)),
			signal: controller.signal,
		});

		const rawText = await response.text();
		let data: unknown = null;

		try {
			data = rawText ? JSON.parse(rawText) : null;
		} catch {
			data = null;
		}

		if (!response.ok) {
			const providerError = ProviderErrorSchema.safeParse(data);
			const providerMessage = providerError.success
				? (providerError.data.error?.message ??
					providerError.data.message ??
					(rawText ? rawText.slice(0, 250) : "No provider error body"))
				: rawText
					? rawText.slice(0, 250)
					: "No provider error body";

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
			throw new Error(
				`AI API HTTP ${response.status} (${attemptLabel}): ${providerMessage}`,
			);
		}

		const aiResponse = AiResponseSchema.parse(data);
		const aiRawText = aiResponse.choices[0]?.message?.content.trim() ?? "";

		if (!aiRawText) {
			throw new Error("AI returned an empty completion payload");
		}

		return aiRawText;
	} catch (error) {
		console.error("[Z.AI] Error", error);
		if (error instanceof Error && error.name === "AbortError") {
			throw new Error(
				`AI request timeout (${attemptLabel}): no response in 100s`,
			);
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}
