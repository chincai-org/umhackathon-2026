const API_KEY = process.env.NEWS_API?.trim() || "your_key_here";

export interface NewsArticle {
	title: string;
	description: string;
	url: string;
	published_at: string;
	source: string;
	country?: string;
	_searchKeyword: string;
}

interface NewsApiArticle {
	title?: string;
	description?: string;
	url?: string;
	published_at?: string;
	source?: string;
	country?: string;
}

interface NewsApiResponse {
	data?: NewsApiArticle[];
	error?: unknown;
}

const riskKeywords: string[] = [
	"flood",
	"landslide",
	"road closure",
	"oil price",
	"freight rate",
	"tariff",
	"political unrest",
];

export function buildApiUrl(
	keyword: string,
	num: number = 10,
	baseDate: Date = new Date(),
) {
	const now = baseDate;
	const today = now.toISOString().split("T")[0];
	const start = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
	);
	const startDate = start.toISOString().split("T")[0];

	const params = new URLSearchParams({
		access_key: API_KEY,
		keywords: keyword,
		categories: "business,general",
		countries: "my",
		languages: "en",
		sort: "published_desc",
		limit: num.toString(),
		date: `${startDate},${today}`,
	});

	return `https://api.mediastack.com/v1/news?${params.toString()}`;
}

export async function getRiskNews(
	keywords: string[] = riskKeywords,
): Promise<NewsArticle[]> {
	const allArticles: NewsArticle[] = [];

	for (const keyword of keywords) {
		const url = buildApiUrl(keyword);

		try {
			const response = await fetch(url, { method: "GET" });

			if (!response.ok) continue;

			const results = (await response.json()) as NewsApiResponse;

			if (results.error) continue;

			if (results.data && Array.isArray(results.data)) {
				const filtered = results.data
					.filter(
						(
							article,
						): article is Required<
							Pick<
								NewsApiArticle,
								"title" | "description" | "url" | "published_at" | "source"
							>
						> &
							NewsApiArticle =>
							Boolean(
								article.title &&
									article.description &&
									article.url &&
									article.published_at &&
									article.source,
							),
					)
					.map((article) => ({
						title: article.title,
						description: article.description?.substring(0, 300) || "",
						url: article.url,
						published_at: article.published_at,
						source: article.source,
						country: article.country,
						_searchKeyword: keyword,
					}));

				allArticles.push(...filtered);
			}

			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch {
			continue;
		}
	}

	return allArticles;
}
