import { search } from "./util⚡🛠.ts";

const API_KEY = process.env.NEWS_API?.trim() || "your_key_here";
interface NewsArticle {
    title: string;
    description: string;
    url: string;
    published_at: string; // Time when it was published
    source: string;
    country?: string;
    _searchKeyword: string; // Track which keyword triggered this result
}

interface RiskAssessment {
    risk_level: "None" | "Low" | "Medium" | "High" | "Severe";
    reasoning: string;
    actions: string[];
    confidence_percent: number;
    analyzed_articles: number;
    timestamp: string;
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

function buildapiUrl(keyword: string, num: number = 10) {
    var d = new Date();
    var m = d.getMonth();
    d.setMonth(d.getMonth() - 1);
    const today = new Date().toISOString().split("T")[0];

    // If still in same month, set date to last day of
    // previous month
    if (d.getMonth() == m) d.setDate(0);
    d.setHours(0, 0, 0, 0);
    const oneMonthAgo = d.toISOString().split("T")[0];
    const params = new URLSearchParams({
        access_key: API_KEY,
        keywords: keyword,
        categories: "business,general",
        countries: "my",
        languages: "en",
        sort: "published_desc",
        limit: num.toString(),
        date: "2025-04-26" + "," + today, // ⚠️Please change to only get news from one month ago
    });
    const url = `https://api.mediastack.com/v1/news?${params.toString()}`;
    return url;
}

async function getRiskNews(
    keywords: string[] = riskKeywords,
): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];

    // ✅ Use for...of instead of forEach to properly await async calls
    for (const keyword of keywords) {
        const url = buildapiUrl(keyword);

        try {
            console.log(`🔍 Fetching news for: "${keyword}"`);
            const response = await fetch(url, { method: "GET" });

            if (!response.ok) {
                console.warn(
                    `⚠️ API error for "${keyword}": ${response.status} ${response.statusText}`,
                );
                continue; // Skip to next keyword instead of crashing
            }

            const results = await response.json();

            // Handle API error responses
            if (results.error) {
                console.warn(
                    `⚠️ MediaStack error for "${keyword}":`,
                    results.error.message,
                );
                continue;
            }

            // ✅ Extract ONLY essential fields - no scoring, let LLM decide relevance
            if (results.data && Array.isArray(results.data)) {
                const filtered = results.data
                    .filter(
                        (article: any) => article.title && article.description,
                    ) // Basic validation
                    .map((article: any) => ({
                        title: article.title,
                        description:
                            article.description?.substring(0, 300) || "", // Truncate for token efficiency
                        url: article.url,
                        published_at: article.published_at,
                        source: article.source,
                        country: article.country,
                        _searchKeyword: keyword, // Keep track for debugging/traceability
                    }));

                allArticles.push(...filtered);
                console.log(
                    `✓ Found ${filtered.length} articles for "${keyword}"`,
                );
            }

            // Respect rate limits: small delay between requests
            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`❌ Failed to fetch news for "${keyword}":`, error);
            // Continue with other keywords instead of failing entirely
        }
    }

    console.log(`📦 Total articles collected: ${allArticles.length}`);
    return allArticles;
}

const news: NewsArticle[] = await getRiskNews();
console.log(news);
// const result = await search("logistic regulation", 10, d);
// console.log(result);

// Response from calling the API with keyword 'flood'
const example_input = {
    pagination: {
        limit: 10,
        offset: 0,
        count: 10,
        total: 14,
    },
    data: [
        {
            author: null,
            title: "Nearly 6,000 evacuated as flood situation remains critical in five Sabah districts",
            description:
                "KOTA KINABALU: Nearly 6,000 people have sought shelter as Sabah's flood situation remains critical on the third day in the state's interior and southwestern districts. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/27/nearly-6000-evacuated-as-flood-situation-remains-critical-in-five-sabah-districts",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/27/3790332.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-27T07:26:00+00:00",
        },
        {
            author: null,
            title: "STPM candidates evacuated from flood-hit villages in Paitan",
            description:
                "KOTA KINABALU: Flood-affected STPM candidates sitting for Monday's STPM examination are being transported out of their villages on Sunday (Feb 22). Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/22/stpm-candidates-evacuated-from-flood-hit-villages-in-paitan",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/22/3780780.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-22T07:16:00+00:00",
        },
        {
            author: null,
            title: "Sabah flood evacuees increase to 4,652 in northern districts",
            description:
                "KOTA KINABALU: Flood relief centres in Pitas, Paitan and Kota Marudu continue to register new victims with the number increasing to 4,652 people from 1,799 families. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/21/sabah-flood-evacuees-increase-to-4652-in-northern-districts",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/21/3779970.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-21T09:16:00+00:00",
        },
        {
            author: null,
            title: "Perak floods due to intense rainfall, not river overflow, says MB",
            description:
                "IPOH: Flash floods in Manjoi and several areas here since last Friday were caused by intense rainfall rather than overflow from Sungai Perak, says Datuk Seri Saarani Mohamad. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/19/perak-floods-due-to-intense-rainfall-not-river-overflow-says-mb",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/19/3777039.jpeg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-19T10:26:00+00:00",
        },
        {
            author: null,
            title: "Ipoh City Council mobilises emergency response to flood victims in Manjoi",
            description:
                "IPOH: The Ipoh City Council (MBI) has mobilised emergency response teams to assist flood victims in Manjoi and several surrounding areas here following days of heavy rain that triggered flooding and storm damage across the city. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/18/ipoh-city-council-mobilises-emergency-response-to-flood-victims-in-manjoi",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/18/3775534.JPG",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-18T13:11:00+00:00",
        },
        {
            author: null,
            title: "Kinta floods: Number of victims decreases as of 8am",
            description:
                "IPOH: The number of flood victims in Kinta dropped to 11 people from five families as of 8am Wednesday (Feb 18), compared to 26 people from 10 families on Tuesday (Feb 17). Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/02/18/kinta-floods-number-of-victims-decreases-as-of-8am",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/02/18/3774678.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-02-18T01:04:00+00:00",
        },
        {
            author: null,
            title: "Sarawak government provides assistance to flood victims in Sibu Division",
            description:
                "SIBU: The Sarawak government activated three temporary evacuation centres in the Sibu Division to shelter residents affected by recent flooding. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/01/12/sarawak-government-provides-assistance-to-flood-victims-in-sibu-division",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/01/12/3715648.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-01-12T02:51:00+00:00",
        },
        {
            author: null,
            title: "Floods: Over 400 evacuated in Sarawak",
            description:
                "KUCHING: Over 400 flood victims have been moved to temporary relief centres after heavy rain overnight in parts of Sarawak. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/01/09/floods-over-400-evacuated-in-sarawak",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/01/09/3711977.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-01-09T03:21:00+00:00",
        },
        {
            author: null,
            title: "Floods: Victims increase in Sabah, Sarawak, number maintains in Johor",
            description:
                "KUALA LUMPUR: The number of flood evacuees housed at temporary relief centres in Sabah and Sarawak continued to rise this afternoon, while the situation in Johor remained unchanged, and as of 4pm, a total of 1,777 evacuees were recorded across the three states. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/01/06/floods-victims-increase-in-sabah-sarawak-number-maintains-in-johor",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/01/06/3707670.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-01-06T11:52:00+00:00",
        },
        {
            author: null,
            title: "Sabah&#039;s Tenom district declared a flood disaster zone",
            description:
                "KOTA KINABALU: Sabah's interior district of Tenom has been declared a flood disaster district, making it the fourth district to be hit by floods following heavy rains over the weekend. Read full story",
            url: "https://www.thestar.com.my/news/nation/2026/01/05/sabah039s-tenom-district-declared-a-flood-disaster-zone",
            source: "The Star online",
            image: "https://apicms.thestar.com.my/uploads/images/2026/01/05/3705575.jpg",
            category: "general",
            language: "en",
            country: "my",
            published_at: "2026-01-05T09:21:00+00:00",
        },
    ],
};
//example output after combining all the news article
const example_output: NewsArticle[] = [
    {
        title: "Nearly 6,000 evacuated as flood situation remains critical in five Sabah districts",
        description:
            "KOTA KINABALU: Nearly 6,000 people have sought shelter as Sabah's flood situation remains critical on the third day in the state's interior and southwestern districts. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/27/nearly-6000-evacuated-as-flood-situation-remains-critical-in-five-sabah-districts",
        published_at: "2026-02-27T07:26:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "STPM candidates evacuated from flood-hit villages in Paitan",
        description:
            "KOTA KINABALU: Flood-affected STPM candidates sitting for Monday's STPM examination are being transported out of their villages on Sunday (Feb 22). Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/22/stpm-candidates-evacuated-from-flood-hit-villages-in-paitan",
        published_at: "2026-02-22T07:16:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Sabah flood evacuees increase to 4,652 in northern districts",
        description:
            "KOTA KINABALU: Flood relief centres in Pitas, Paitan and Kota Marudu continue to register new victims with the number increasing to 4,652 people from 1,799 families. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/21/sabah-flood-evacuees-increase-to-4652-in-northern-districts",
        published_at: "2026-02-21T09:16:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Perak floods due to intense rainfall, not river overflow, says MB",
        description:
            "IPOH: Flash floods in Manjoi and several areas here since last Friday were caused by intense rainfall rather than overflow from Sungai Perak, says Datuk Seri Saarani Mohamad. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/19/perak-floods-due-to-intense-rainfall-not-river-overflow-says-mb",
        published_at: "2026-02-19T10:26:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Ipoh City Council mobilises emergency response to flood victims in Manjoi",
        description:
            "IPOH: The Ipoh City Council (MBI) has mobilised emergency response teams to assist flood victims in Manjoi and several surrounding areas here following days of heavy rain that triggered flooding and storm damage across the city. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/18/ipoh-city-council-mobilises-emergency-response-to-flood-victims-in-manjoi",
        published_at: "2026-02-18T13:11:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Kinta floods: Number of victims decreases as of 8am",
        description:
            "IPOH: The number of flood victims in Kinta dropped to 11 people from five families as of 8am Wednesday (Feb 18), compared to 26 people from 10 families on Tuesday (Feb 17). Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/02/18/kinta-floods-number-of-victims-decreases-as-of-8am",
        published_at: "2026-02-18T01:04:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Sarawak government provides assistance to flood victims in Sibu Division",
        description:
            "SIBU: The Sarawak government activated three temporary evacuation centres in the Sibu Division to shelter residents affected by recent flooding. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/01/12/sarawak-government-provides-assistance-to-flood-victims-in-sibu-division",
        published_at: "2026-01-12T02:51:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Floods: Over 400 evacuated in Sarawak",
        description:
            "KUCHING: Over 400 flood victims have been moved to temporary relief centres after heavy rain overnight in parts of Sarawak. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/01/09/floods-over-400-evacuated-in-sarawak",
        published_at: "2026-01-09T03:21:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Floods: Victims increase in Sabah, Sarawak, number maintains in Johor",
        description:
            "KUALA LUMPUR: The number of flood evacuees housed at temporary relief centres in Sabah and Sarawak continued to rise this afternoon, while the situation in Johor remained unchanged, and as of 4pm, a total of 1,777 evacuees were recorded across the three states. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/01/06/floods-victims-increase-in-sabah-sarawak-number-maintains-in-johor",
        published_at: "2026-01-06T11:52:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Sabah&#039;s Tenom district declared a flood disaster zone",
        description:
            "KOTA KINABALU: Sabah's interior district of Tenom has been declared a flood disaster district, making it the fourth district to be hit by floods following heavy rains over the weekend. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/01/05/sabah039s-tenom-district-declared-a-flood-disaster-zone",
        published_at: "2026-01-05T09:21:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "flood",
    },
    {
        title: "Govt increasing gas production, RON95 to stay at RM1.99, says Anwar",
        description:
            "BUKIT MERTAJAM: Malaysia will continue to hold the RON95 petrol price at RM1.99 per litre despite surging global oil prices, with supply expected to last until May, says Datuk Seri Anwar Ibrahim. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/03/20/govt-increasing-gas-production-ron95-to-stay-at-rm199-says-anwar",
        published_at: "2026-03-20T07:57:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "oil price",
    },
    {
        title: "Sabah consumer group lauds govt decision to maintain diesel subsidy",
        description:
            "KOTA KINABALU: The Federal Government's decision to maintain diesel subsidy for Sabah is crucial in ensuring cost of goods remains stable amid surging global oil prices. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/03/20/sabah-consumer-group-lauds-govt-decision-to-maintain-diesel-subsidy",
        published_at: "2026-03-20T01:41:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "oil price",
    },
    {
        title: "Geopolitics to be a major challenge in 2026, says Economy Minister",
        description:
            "PUTRAJAYA: The Economy Ministry is monitoring geopolitical developments following the United States' arrest of Venezuela's former president, Nicolas Maduro, which led to a recent decline in crude oil prices, says Akmal Nasrullah Mohd Nasir. Read full story",
        url: "https://www.thestar.com.my/news/nation/2026/01/08/geopolitics-to-be-a-major-challenge-in-2026-says-economy-minister",
        published_at: "2026-01-08T03:43:00+00:00",
        source: "The Star online",
        country: "my",
        _searchKeyword: "oil price",
    },
];
// const allArticles: NewsArticle[] = [];
// const results = example_input;
// if (results.data && Array.isArray(results.data)) {
//     const filtered = results.data
//         .filter((article: any) => article.title && article.description) // Basic validation
//         .map((article: any) => ({
//             title: article.title,
//             description: article.description?.substring(0, 300) || "", // Truncate for token efficiency
//             url: article.url,
//             published_at: article.published_at,
//             source: article.source,
//             country: article.country,
//             _searchKeyword: "flood", // Keep track for debugging/traceability
//         }));

//     allArticles.push(...filtered);
//     console.log(`✓ Found ${filtered.length} articles for "${"flood"}"`);
//     console.log(allArticles);
// }
