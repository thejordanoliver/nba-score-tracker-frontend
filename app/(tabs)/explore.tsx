import EmptyState from "components/Explore/EmptyState";
import SearchResultsList from "components/Explore/SearchResultsList";
import players from "constants/players";
import { teamsById } from "constants/teams";
import { styles } from "styles/Explore.styles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import SearchBar from "../../components/Explore/SearchBar";
import { ResultItem, PlayerResult, TeamResult, UserResult } from "types/types";
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const RECENT_SEARCHES_KEY = "recentSearches";


const tabs = ["All", "Teams", "Players", "Accounts"] as const;

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]>("All");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<ResultItem[]>([]);

  const navigation = useNavigation();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const inputAnim = useRef(new Animated.Value(0)).current;
  const deleteRecentSearch = async (itemToDelete: ResultItem) => {
    try {
      const existing = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let parsed: ResultItem[] = existing ? JSON.parse(existing) : [];

      parsed = parsed.filter(
        (item) =>
          !(
            item.type === itemToDelete.type &&
            (item as any).id === (itemToDelete as any).id
          )
      );

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(parsed));
      setRecentSearches(parsed);
    } catch (err) {
      console.warn("Failed to delete recent search", err);
    }
  };

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setCurrentUserId(Number(id));
    };
    loadUserId();
  }, []);

  useEffect(() => {
    Animated.timing(inputAnim, {
      toValue: searchVisible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    if (searchVisible) {
      loadRecentSearches();
    }
  }, [searchVisible]);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setError(null);
      setSelectedTab("All");
      return;
    }

    const fetchFromDb = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<{
          players: PlayerResult[];
          teams: TeamResult[];
          users: UserResult[];
        }>(`${API_URL}/api/search`, { params: { query } });

        const combined: ResultItem[] = [
          ...res.data.teams.map((t) => ({ ...t, type: "team" as const })),
          ...res.data.players.map((p) => ({ ...p, type: "player" as const })),
          ...res.data.users.map((u) => ({ ...u, type: "user" as const })),
        ];

        setResults(combined);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFromDb, 400);
    return () => clearTimeout(debounce);
  }, [query]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          tabName="Explore"
          title="Explore"
          onSearchToggle={() => setSearchVisible((prev) => !prev)}
        />
      ),
    });
  }, [navigation]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validResults = parsed.filter(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            "type" in item &&
            "id" in item
        );
        setRecentSearches(validResults);
      }
    } catch (err) {
      console.warn("Error loading recent searches", err);
    }
  };

  const saveToRecentSearches = async (item: ResultItem) => {
    if (!item || typeof item !== "object" || !item.type || !(item as any).id) {
      console.warn("Invalid item passed to saveToRecentSearches:", item);
      return;
    }

    try {
      const existing = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let parsed: ResultItem[] = existing ? JSON.parse(existing) : [];

      parsed = parsed.filter(
        (r) =>
          !(
            typeof r === "object" &&
            r.type === item.type &&
            (r as any).id === (item as any).id
          )
      );

      parsed.unshift(item);
      parsed = parsed.slice(0, 10);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(parsed));
      setRecentSearches(parsed);
    } catch (err) {
      console.warn("Failed to save recent search", err);
    }
  };

  function isResultItem(obj: any): obj is ResultItem {
    return (
      typeof obj === "object" &&
      obj !== null &&
      typeof obj.id === "number" &&
      typeof obj.type === "string" &&
      ["player", "team", "user"].includes(obj.type)
    );
  }

  const tabToTypeMap = {
    Teams: "team",
    Players: "player",
    Accounts: "user",
  };

  const filteredResults = (query.trim() ? results : recentSearches).filter(
    (item) => {
      if (selectedTab === "All") return true;
      return item.type === tabToTypeMap[selectedTab];
    }
  );

  const getItemKey = (item: ResultItem) => {
    const id = (item as any)?.id;
    if (!id) {
      console.warn("Missing ID for item:", item);
      return `${item.type}-unknown-${Math.random()}`;
    }
    return `${item.type}-${id}`;
  };

  const handleSelectItem = (item: ResultItem) => {
    saveToRecentSearches(item);
    switch (item.type) {
      case "team":
        router.push(`/team/${item.id}`);
        break;
      case "player":
        router.push({
          pathname: "/player/[id]",
          params: {
            id: item.player_id.toString(),
            teamId: item.team_id?.toString() || "",
          },
        });
        break;
      case "user":
        router.push(`/user/${item.id}`);
        break;
    }
  };

  const renderItem = ({ item }: { item: ResultItem }) => {
    if (item.type === "team") {
      const localTeam = teamsById[item.id.toString()];
      const logoSource = isDark
        ? localTeam?.logoLight || localTeam?.logo
        : localTeam?.logo;

      return (
        <View style={styles.itemRow}>
          <Pressable
            onPress={() => handleSelectItem(item)}
            style={[styles.itemContainer, isDark && styles.itemContainerDark]}
          >
            <View style={styles.teamRow}>
              {logoSource && (
                <Image
                  source={logoSource}
                  style={styles.teamLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={[styles.teamName, isDark && styles.textDark]}>
                {localTeam?.fullName}
              </Text>
            </View>
          </Pressable>
          {query.length === 0 && (
            <Pressable onPress={() => deleteRecentSearch(item)}>
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#ccc" : "#333"}
              />
            </Pressable>
          )}
        </View>
      );
    }

    if (item.type === "player") {
      const avatarUrl = item.avatarUrl?.trim()
        ? item.avatarUrl
        : players[item.name];
      const localTeam = teamsById[item.team_id?.toString()];

      return (
        <View style={styles.itemRow}>
          <Pressable
            onPress={() => handleSelectItem(item)}
            style={[styles.itemContainer, isDark && styles.itemContainerDark]}
          >
            <View style={styles.playerRow}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, isDark && styles.textDark]}>
                  {item.name}
                </Text>
                <Text style={[styles.playerTeam, isDark && styles.textDark]}>
                  {localTeam?.fullName || "Free Agent"}
                </Text>
              </View>
            </View>
          </Pressable>
          {query.length === 0 && (
            <Pressable onPress={() => deleteRecentSearch(item)}>
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#ccc" : "#333"}
              />
            </Pressable>
          )}
        </View>
      );
    }

    if (item.type === "user") {
      const profileImageUrl = item.profileImageUrl.startsWith("http")
        ? item.profileImageUrl
        : `${API_URL}${item.profileImageUrl}`;

      return (
        <View style={styles.itemRow}>
          <Pressable
            onPress={() => handleSelectItem(item)}
            style={[styles.itemContainer, isDark && styles.itemContainerDark]}
          >
            <View style={styles.userRow}>
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, isDark && styles.textDark]}>
                  {item.username}
                </Text>
              </View>
            </View>
          </Pressable>
          {query.length === 0 && (
            <Pressable onPress={() => deleteRecentSearch(item)}>
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#ccc" : "#333"}
              />
            </Pressable>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container]}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        visible={searchVisible}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (query.trim().length === 0) setIsFocused(false);
        }}
        tabs={[...tabs]} // spread to convert readonly tuple to mutable string[]
        selectedTab={selectedTab}
        onTabPress={(tab) => setSelectedTab(tab as typeof selectedTab)}
      />

      {!searchVisible && <EmptyState />}

      <SearchResultsList
        data={filteredResults.length ? filteredResults : recentSearches}
        loading={loading}
        error={error}
        onSelect={handleSelectItem}
        onDelete={deleteRecentSearch}
        query={query}
      />
    </View>
  );
}
