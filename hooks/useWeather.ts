import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type WeatherData = {
  tempFahrenheit: number;
  description: string;
  icon: string;
  cityName: string;
  feels_like: number;
  datetime: string; // forecast datetime from API
  localTime?: string; // ISO string of local arena time
  cachedAt: number; // timestamp when cached
  main: string;
  humidity: number;
  wind: Wind
};

type Wind = {
  speed: number;
  deg?: number;
  gust?: number;
};

const getWeatherCacheKey = (lat: number, lon: number, dateStr: string) =>
  `weather_${lat}_${lon}_${dateStr}`;

// expire cached weather after 6 hours
const WEATHER_CACHE_TTL = 6 * 60 * 60 * 1000;

export function useWeatherForecast(
  lat: number | null,
  lon: number | null,
  gameDateStr: string | null
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon || !gameDateStr) {
      console.warn("Weather hook skipped due to missing inputs:", {
        lat,
        lon,
        gameDateStr,
      });
      return;
    }

    const cacheKey = getWeatherCacheKey(lat, lon, gameDateStr);
    let isActive = true;

    const fetchAndCacheWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = "09f079f11f3ea22e5846e249da888468";
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data[0]));
        if (!data.list || data.list.length === 0) {
          throw new Error("No forecast data returned for this location");
        }

        const gameTimestamp = new Date(gameDateStr).getTime();
        let closestForecast = data.list[0];
        let minDiff = Math.abs(gameTimestamp - closestForecast.dt * 1000);

        for (const forecast of data.list) {
          const forecastTimestamp = forecast.dt * 1000;
          const diff = Math.abs(gameTimestamp - forecastTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            closestForecast = forecast;
          }
        }

        const tempFahrenheit = closestForecast.main.temp * (9 / 5) + 32;
const feelsLikeFahrenheit = closestForecast.main.feels_like * (9 / 5) + 32;

        // compute local arena time using city timezone offset (in seconds)
        let localTime: string | undefined;
        if (data.city?.timezone !== undefined) {
          const localMs = closestForecast.dt * 1000 + data.city.timezone * 1000;
          localTime = new Date(localMs).toISOString();
        }

    const freshWeather: WeatherData = {
  tempFahrenheit,
  description: closestForecast.weather[0].description,
  icon: `https://openweathermap.org/img/wn/${closestForecast.weather[0].icon}@2x.png`,
  cityName: data.city.name,
  datetime: closestForecast.dt_txt,
  localTime,
  cachedAt: Date.now(),
  main: closestForecast.weather[0].main,
  humidity: closestForecast.main.humidity,
  wind: { speed: closestForecast.wind.speed },
  feels_like: feelsLikeFahrenheit, // ✅ now in Fahrenheit
};

        await AsyncStorage.setItem(cacheKey, JSON.stringify(freshWeather));

        if (isActive) {
          setWeather(freshWeather);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Weather fetch error:", err);
        if (isActive) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    const loadCachedThenFetch = async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cachedData: WeatherData = JSON.parse(cached);

          // check if cache is fresh
          if (Date.now() - cachedData.cachedAt < WEATHER_CACHE_TTL) {
            if (isActive) {
              setWeather(cachedData);
              setLoading(false);
            }
          } else {
            // expired cache, remove it
            await AsyncStorage.removeItem(cacheKey);
            console.log("Expired weather cache removed:", cacheKey);
          }
        } else {
          console.log("Weather cache miss:", cacheKey);
          setLoading(true);
        }
      } catch (err: any) {
        console.error("Weather cache read error:", err);
      }

      // Always try fetching fresh data in background
      fetchAndCacheWeather();
    };

    loadCachedThenFetch();

    return () => {
      isActive = false;
    };
  }, [lat, lon, gameDateStr]);

  return { weather, loading, error };
}
