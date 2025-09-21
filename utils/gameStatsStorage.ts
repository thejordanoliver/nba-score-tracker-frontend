// utils/gameStatsStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const GAME_STATS_KEY = "GAME_STATS_CACHE";
const EXPIRATION_DAYS = 7;

type CachedStat = {
  gameId: number;
  timestamp: number;
  data: any;
};

export async function loadGameStats(gameId: number): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(GAME_STATS_KEY);
    if (!raw) return null;

    const cache: CachedStat[] = JSON.parse(raw);
    const now = Date.now();

    const validCache = cache.filter(
      (entry) => now - entry.timestamp < EXPIRATION_DAYS * 24 * 60 * 60 * 1000
    );

    const gameEntry = validCache.find((entry) => entry.gameId === gameId);

    // Save back the cleaned cache
    await AsyncStorage.setItem(GAME_STATS_KEY, JSON.stringify(validCache));

    return gameEntry ? gameEntry.data : null;
  } catch (err) {
    console.error("Failed to load game stats cache", err);
    return null;
  }
}

export async function saveGameStats(gameId: number, data: any) {
  try {
    const raw = await AsyncStorage.getItem(GAME_STATS_KEY);
    const cache: CachedStat[] = raw ? JSON.parse(raw) : [];

    const updatedCache = cache.filter((entry) => entry.gameId !== gameId);

    updatedCache.push({
      gameId,
      data,
      timestamp: Date.now(),
    });

    await AsyncStorage.setItem(GAME_STATS_KEY, JSON.stringify(updatedCache));
  } catch (err) {
    console.error("Failed to save game stats cache", err);
  }
}
