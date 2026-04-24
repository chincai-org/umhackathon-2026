const FUELPRICE_URL = "https://api.data.gov.my/data-catalogue?id=fuelprice";

type FuelPriceRow = {
    date: string;
    diesel: number | null;
};

export async function getDieselSignal(): Promise<{
    dieselLabel: string;
    dieselNote: string;
}> {
    try {
        const response = await fetch(FUELPRICE_URL);
        if (!response.ok) {
            throw new Error(`Fuel API HTTP ${response.status}`);
        }

        const rows = (await response.json()) as FuelPriceRow[];
        const latest = rows
            .filter(
                (row) =>
                    row?.date &&
                    row?.diesel !== null &&
                    row?.diesel !== undefined &&
                    !Number.isNaN(new Date(row.date).getTime()),
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!latest) {
            return {
                dieselLabel: "N/A",
                dieselNote: "Latest price signal unavailable",
            };
        }

        return {
            dieselLabel: `RM${latest.diesel!.toFixed(2)} / L`,
            dieselNote: `Latest update: ${latest.date}`,
        };
    } catch (error) {
        return {
            dieselLabel: "N/A",
            dieselNote:
                error instanceof Error
                    ? error.message
                    : "Failed to load diesel signal",
        };
    }
}
