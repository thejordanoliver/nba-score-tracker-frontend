import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WeatherData = {
  tempFahrenheit: number;
  description: string;
  icon: string;
  cityName: string;
  datetime: string; // forecast datetime
  main: string;     // high-level condition, e.g. "Clear", "Clouds", "Rain"
  localTime?: string; // ISO string of arena's local time (optional)
};


export type Arena = {
  name: string;
  latitude: number;
  longitude: number;
};

const getWeatherCacheKey = (
  lat: number | null,
  lon: number | null,
  location: string | null,
  dateStr: string
) => {
  if (lat && lon) return `weather_${lat}_${lon}_${dateStr}`;
  if (location) return `weather_${location}_${dateStr}`;
  return `weather_unknown_${dateStr}`;
};

export function useWeatherForecast(
  lat: number | null,
  lon: number | null,
  gameDateStr: string | null,
  location: string | null = null
) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setLoading] = useState(false);
  const [weatherError, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((!lat || !lon) && !location) {
      console.warn("Weather hook skipped due to missing inputs:", {
        lat,
        lon,
        location,
        gameDateStr,
      });
      return;
    }
    if (!gameDateStr) return;

    const cacheKey = getWeatherCacheKey(lat, lon, location, gameDateStr);

    let isActive = true;

    const fetchAndCacheWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = "09f079f11f3ea22e5846e249da888468";

        // If lat/lon not provided, resolve from location
        let resolvedLat = lat;
        let resolvedLon = lon;

        if ((!resolvedLat || !resolvedLon) && location) {
          const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
            location
          )}&limit=1&appid=${apiKey}`;
          const geoRes = await fetch(geoUrl);
          if (!geoRes.ok) throw new Error("Failed to geocode location");
          const geoData = await geoRes.json();
          if (!geoData[0]) throw new Error("No geocoding results for location");

          resolvedLat = geoData[0].lat;
          resolvedLon = geoData[0].lon;
        }

        if (!resolvedLat || !resolvedLon) {
          throw new Error("No valid coordinates for weather lookup");
        }

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${resolvedLat}&lon=${resolvedLon}&units=metric&appid=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch weather forecast");
        }

        const data = await response.json();
        if (!data.list || data.list.length === 0) {
          throw new Error("No forecast data returned for this location");
        }

        // Find closest forecast to game datetime
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

      const freshWeather: WeatherData = {
  tempFahrenheit,
  description: closestForecast.weather[0].description,
  icon: `https://openweathermap.org/img/wn/${closestForecast.weather[0].icon}@2x.png`,
  cityName: data.city.name,
  datetime: closestForecast.dt_txt,
  main: closestForecast.weather[0].main, // e.g. "Rain", "Clear", "Clouds"
  localTime: new Date(closestForecast.dt * 1000).toISOString(), // optional, ISO string
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
          setWeather(null);
          setLoading(false);
        }
      }
    };

    const loadCachedThenFetch = async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const cachedData: WeatherData = JSON.parse(cached);
          if (isActive) {
            setWeather(cachedData);
            setLoading(false);
          }
        } else {
          setLoading(true);
        }
      } catch (err: any) {
        console.error("Weather cache read error:", err);
        if (isActive) {
          setError(err.message);
          setWeather(null);
          setLoading(false);
        }
      }

      // Fetch fresh in background regardless
      fetchAndCacheWeather();
    };

    loadCachedThenFetch();

    return () => {
      isActive = false;
    };
  }, [lat, lon, location, gameDateStr]);

  return { weather, weatherLoading, weatherError };
}