import { useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { teams as nbaTeams } from "constants/teams";
import {  teams as nflTeams } from "constants/teamsNFL";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export function useFavoriteTeams() {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Combine NBA and NFL teams
  const allTeams = useMemo(() => [...nbaTeams, ...nflTeams], []);

  // Filtered teams based on search query
  const filteredTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const fullName = team.fullName;
      return fullName.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, allTeams]);

  // Load username and favorites from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        const storedFavorites = await AsyncStorage.getItem("favorites");

        if (storedUsername) {
          setUsername(storedUsername);
          if (storedFavorites) {
            try {
              const parsedFavorites = JSON.parse(storedFavorites);
              setFavorites(parsedFavorites);
            } catch (err) {
              console.error("Failed to parse favorites JSON", err);
              setFavorites([]);
            }
          } else {
            setFavorites([]);
          }
        } else {
          setUsername(null);
          setFavorites([]);
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Toggle favorite using composite ID "LEAGUE:id"
  const toggleFavorite = (league: "NBA" | "NFL", id: string | number) => {
    const key = `${league}:${id}`;
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  // Check if a team is favorited
  const isFavorite = (league: "NBA" | "NFL", id: string | number) =>
    favorites.includes(`${league}:${id}`);

  // Toggle between grid and list layout with fade animation
const toggleLayout = () => {
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    setIsGridView((prev) => !prev); // flips grid/list
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  });
};

  // Save favorites to backend + AsyncStorage
  const saveFavorites = async () => {
    if (!username) {
      console.warn("Username not loaded");
      return false;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/users/${username}/favorites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites }),
      });

      if (!res.ok) throw new Error("Failed to update favorites");

      await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
      return true;
    } catch (err) {
      console.error("Error saving favorites", err);
      return false;
    }
  };

  return {
    search,
    setSearch,
    favorites,
    setFavorites,
    username,
    isLoading,
    isGridView,
    toggleLayout,
    toggleFavorite,
    isFavorite,
    fadeAnim,
    saveFavorites,
    filteredTeams,
  };
}
