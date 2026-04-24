const FUELPRICE_URL = "https://api.data.gov.my/data-catalogue?id=fuelprice";

type FuelPriceRow = {
    date: string;
    diesel: number | null;
};

export async function getDieselSignal(): Promise<{
    dieselLabel: string;
    dieselNote: string;
    dieselCaret: "^" | "v" | "-" | "?";
    dieselHoverNote: string;
}> {
    try {
        const response = await fetch(FUELPRICE_URL);
        if (!response.ok) {
            throw new Error(`Fuel API HTTP ${response.status}`);
        }

        const rows = (await response.json()) as FuelPriceRow[];
        const sortedRows = rows
            .filter(
                (row) =>
                    row?.date &&
                    row?.diesel !== null &&
                    row?.diesel !== undefined &&
                    !Number.isNaN(new Date(row.date).getTime()),
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sortedRows[0];
        const previous = sortedRows[1];

        if (!latest) {
            return {
                dieselLabel: "N/A",
                dieselNote: "Latest price signal unavailable",
                dieselCaret: "?",
                dieselHoverNote: "No diesel trend data",
            };
        }

        const delta =
            previous && previous.diesel !== null
                ? latest.diesel! - previous.diesel
                : null;
        const dieselCaret = delta === null ? "?" : delta > 0 ? "^" : delta < 0 ? "v" : "-";
        const changeText =
            delta === null
                ? "No previous daily point"
                : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} vs ${previous!.date}`;

        return {
            dieselLabel: `RM${latest.diesel!.toFixed(2)} / L`,
            dieselNote: `Latest update: ${latest.date}`,
            dieselCaret,
            dieselHoverNote: `Daily change: ${changeText}`,
        };
    } catch (error) {
        return {
            dieselLabel: "N/A",
            dieselNote:
                error instanceof Error
                    ? error.message
                    : "Failed to load diesel signal",
            dieselCaret: "?",
            dieselHoverNote: "Daily trend unavailable",
        };
    }
}
