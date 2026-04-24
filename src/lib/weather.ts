const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

export const zones = {
  west: {
    name: "West Coast",
    lat: 3.139,
    lon: 101.6869,
  },

  north: {
    name: "North",
    lat: 5.4164,
    lon: 100.3327,
  },

  east: {
    name: "East Coast",
    lat: 3.8077,
    lon: 103.326,
  },

  east_malaysia: {
    name: "East Malaysia",
    lat: 5.9804,
    lon: 116.0735,
  },
};

type ZoneWeather = {
  name: string;
  label: string;
  condition: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  error?: string | null;
};

// -------------------------
// FETCH WEATHER (SAFE)
// -------------------------
async function fetchZone(lat: number, lon: number) {
  try {
    const url =
      `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,precipitation,wind_speed_10m` +
      `&hourly=precipitation_probability,visibility` +
      `&timezone=Asia/Kuala_Lumpur`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Weather API HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Unknown weather fetch error"
    );
  }
}

// -------------------------
// WEATHER INTELLIGENCE ENGINE
// -------------------------
function computeWeather(data: any): {
  condition: string;
  risk: ZoneWeather["risk"];
} {
  const rainProb = data.hourly?.precipitation_probability?.[0] ?? 0;
  const vis = data.hourly?.visibility?.[0] ?? 10000;
  const wind = data.current?.wind_speed_10m ?? 0;
  const rain = data.current?.precipitation ?? 0;

  // ⛈ Severe storm (logistics-critical)
  if (rain > 5 && wind > 35 && rainProb > 60) {
    return {
      condition: "⛈ Storm Risk",
      risk: "HIGH",
    };
  }

  // 🌧 Heavy rain
  if (rainProb > 70 || rain > 2) {
    return {
      condition: "🌧 Rain",
      risk: "HIGH",
    };
  }

  // 🌦 Light rain / unstable
  if (rainProb > 40) {
    return {
      condition: "🌦 Light Rain",
      risk: "MEDIUM",
    };
  }

  // 🌫 Low visibility / haze
  if (vis < 2000) {
    return {
      condition: "🌫 Low Visibility",
      risk: "HIGH",
    };
  }

  // 🌬 Windy
  if (wind > 30) {
    return {
      condition: "🌬 Windy",
      risk: "MEDIUM",
    };
  }

  // ☀ Stable
  return {
    condition: "☀ Stable",
    risk: "LOW",
  };
}

// -------------------------
// MAIN FUNCTION
// -------------------------
export async function getRegionalWeatherSafe() {
  const entries = Object.entries(zones);

  const results = await Promise.allSettled(
    entries.map(async ([key, zone]) => {
      const data = await fetchZone(zone.lat, zone.lon);

      const weather = computeWeather(data);

      return [
        key,
        {
          name: zone.name,
          label: `${data.current?.temperature_2m?.toFixed(1)}°C`,
          condition: weather.condition,
          risk: weather.risk,
          error: null,
        },
      ] as const;
    })
  );

  const out: Record<string, ZoneWeather> = {};

  for (const r of results) {
    if (r.status === "fulfilled") {
      const [key, value] = r.value;
      out[key] = value;
    }
  }

  // -------------------------
  // FALLBACK (ENSURE UI NEVER BREAKS)
  // -------------------------
  for (const [key, zone] of Object.entries(zones)) {
    if (!out[key]) {
      out[key] = {
        name: zone.name,
        label: "N/A",
        condition: "⚠ No Data",
        risk: "UNKNOWN",
        error: "Weather unavailable",
      };
    }
  }

  return out;
}