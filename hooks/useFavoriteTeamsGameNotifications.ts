import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

type GameStatus = "scheduled" | "live" | "halftime" | "final";

interface Game {
  id: number;
  status: {
    long: string; // e.g., "Scheduled", "In Progress", "Halftime", "Final"
    short: string; // e.g., "S", "1H", "HT", "F"
  };
  teams: {
    home: { id: number };
    visitors: { id: number };
  };
  date: string;
}

interface Notification {
  id: string;
  message: string;
  gameId: number;
}

export function useFavoriteTeamsGameNotifications(pollInterval = 60000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevStatuses = useRef<Record<number, string>>({}); // gameId -> status.long

  useEffect(() => {
let intervalId: number;

    async function fetchFavoriteGames() {
      try {
        const favJson = await AsyncStorage.getItem("favorites");
        if (!favJson) return;

        const favoriteTeams: string[] = JSON.parse(favJson);
        if (favoriteTeams.length === 0) return;

        // You can batch fetch games for all favorite teams or loop one by one.
        // Here's a simple example fetching all games for the season and filtering them:
        // Adjust this API URL to match your actual backend/API.

        const res = await axios.get<{ response: Game[] }>(
          `https://${process.env.EXPO_PUBLIC_RAPIDAPI_HOST}/games`,
          {
            params: {
              league: "standard",
              season: "2025", // you might want to make season dynamic
            },
            headers: {
              "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
              "X-RapidAPI-Host": process.env.EXPO_PUBLIC_RAPIDAPI_HOST!,
            },
          }
        );

        const allGames = res.data.response;

        // Filter only games involving favorite teams
        const favGames = allGames.filter((game) => {
          const homeId = String(game.teams.home.id);
          const visitorId = String(game.teams.visitors.id);
          return favoriteTeams.includes(homeId) || favoriteTeams.includes(visitorId);
        });

        favGames.forEach((game) => {
          const prevStatus = prevStatuses.current[game.id];
          const currStatus = game.status.long.toLowerCase();

          if (prevStatus !== currStatus) {
            prevStatuses.current[game.id] = currStatus;

            let msg: string | null = null;
            if (currStatus === "in progress" || currStatus === "live") {
              msg = `Game started for your favorite team!`;
            } else if (currStatus === "halftime") {
              msg = `Halftime update for your favorite team.`;
            } else if (currStatus === "final" || currStatus === "ended") {
              msg = `Game ended for your favorite team.`;
            }

            if (msg) {
              setNotifications((prev) => [
                ...prev,
                { id: `${game.id}-${currStatus}`, message: msg, gameId: game.id },
              ]);
            }
          }
        });
      } catch (err) {
        console.error("Failed to fetch favorite teams games for notifications:", err);
      }
    }

    fetchFavoriteGames();
    intervalId = setInterval(fetchFavoriteGames, pollInterval);

    return () => clearInterval(intervalId);
  }, [pollInterval]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, dismissNotification };
}
