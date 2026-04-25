const FUELPRICE_URL = "https://api.data.gov.my/data-catalogue?id=fuelprice";
const FUELPRICE_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedDieselSignal:
    | {
          at: number;
          data: {
              dieselLabel: string;
              dieselNote: string;
              dieselCaret: "^" | "v" | "-" | "?";
              dieselHoverNote: string;
              updatedAt: number;
          };
      }
    | null = null;

type FuelPriceRow = {
    date: string;
    diesel: number | null;
    series_type?: "level" | "change_weekly" | string;
};

export async function getDieselSignal(): Promise<{
    dieselLabel: string;
    dieselNote: string;
    dieselCaret: "^" | "v" | "-" | "?";
    dieselHoverNote: string;
    updatedAt: number;
}> {
    if (cachedDieselSignal && Date.now() - cachedDieselSignal.at < FUELPRICE_CACHE_TTL_MS) {
        return cachedDieselSignal.data;
    }

    try {
        const response = await fetch(FUELPRICE_URL);
        if (!response.ok) {
            throw new Error(`Fuel API HTTP ${response.status}`);
        }

        const rows = (await response.json()) as FuelPriceRow[];
        const validRows = rows
            .filter(
                (row) =>
                    row?.date &&
                    row?.diesel !== null &&
                    row?.diesel !== undefined &&
                    !Number.isNaN(new Date(row.date).getTime()),
            );
        const latestLevel = validRows
            .filter((row) => row.series_type === "level")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const latestWeeklyChange = validRows
            .filter((row) => row.series_type === "change_weekly")
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!latestLevel) {
            return {
                dieselLabel: "N/A",
                dieselNote: "Latest price signal unavailable",
                dieselCaret: "?",
                dieselHoverNote: "No diesel trend data",
                updatedAt: Date.now(),
            };
        }
        const weeklyDelta = latestWeeklyChange?.diesel ?? null;
        const dieselCaret =
            weeklyDelta === null
                ? "?"
                : weeklyDelta > 0
                  ? "^"
                  : weeklyDelta < 0
                    ? "v"
                    : "-";
        const changeText =
            weeklyDelta === null
                ? "No weekly change point"
                : `${weeklyDelta > 0 ? "+" : ""}${weeklyDelta.toFixed(2)} (week-on-week)`;

        const result = {
            dieselLabel: `RM${latestLevel.diesel!.toFixed(2)} / L`,
            dieselNote: `Latest update: ${latestLevel.date}`,
            dieselCaret,
            dieselHoverNote: `Diesel change: ${changeText}`,
            updatedAt: Date.now(),
        };

        cachedDieselSignal = { at: Date.now(), data: result };

        return result;
    } catch (error) {
        return {
            dieselLabel: "N/A",
            dieselNote:
                error instanceof Error
                    ? error.message
                    : "Failed to load diesel signal",
            dieselCaret: "?",
            dieselHoverNote: "Daily trend unavailable",
            updatedAt: Date.now(),
        };
    }
}
