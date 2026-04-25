// test-ilmu.js
// const response = await fetch("https://api.ilmu.ai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//         Authorization: `Bearer ${process.env.LLM_API}`,
//         "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//         model: "ilmu-glm-5.1",
//         messages: [{ role: "user", content: "Hello from Bun!" }],
//     }),
// });

// const data = await response.json();
// console.log(data.choices?.[0]?.message?.content || data);

// const client = new OpenAI({
//     apiKey: process.env.LLM_API,
//     baseURL: "https://api.ilmu.ai/v1",
// });

// const response = await client.chat.completions.create({
//     model: "ilmu-glm-5.1",
//     messages: [{ role: "user", content: "Explain quicksort in 3 sentences." }],
// });

// console.log(response.choices[0].message.content);

export {};

/**
 * Accepts query search it using Brave API
 * @param query Search query
 * @param num number of result returned
 * @param date Search result until today
 * @returns JSON object of the results
 */
export async function search(query: string, num: number = 20, date: Date) {
    const today: string = new Date().toISOString().split("T")[0];
    const freshness: string = date.toISOString().split("T")[0] + "to" + today;
    const token = process.env.BRAVE_API;

    try {
        const headers: Record<string, string> = {
            accept: "application/json",
            "Accept-Encoding": "gzip",
            "Content-Type": "application/json",
        };

        if (token) {
            headers["X-Subscription-Token"] = token;
        }

        const res = await fetch(
            "https://api.search.brave.com/res/v1/llm/context",
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    q: query,
                    count: num,
                    freshness: freshness,
                }),
            },
        );
        const results: JSON = await res.json();
        return results;
    } catch (err) {
        console.log("API problem");
        console.log(err);
    }
}

// const results = await search(
//     "Black detective conan",
//     20,
//     new Date("2026-1-20"),
// );
// console.log(JSON.stringify(results, null, 4));
