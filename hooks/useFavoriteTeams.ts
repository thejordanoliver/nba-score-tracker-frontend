import { useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { teams } from "constants/teams";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export function useFavoriteTeams() {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      team.fullName.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

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

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleLayout = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsGridView((prev) => !prev);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const saveFavorites = async () => {
    if (!username) {
      console.warn("Username not loaded");
      return;
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
    fadeAnim,
    saveFavorites,
    filteredTeams,
  };
}
