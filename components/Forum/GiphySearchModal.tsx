import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";

const GIPHY_API_KEY = "ziu4cg5WsQ4XKiSNor4rdUxNilamMmU8";

type GifItem = {
  id: string;
  images: {
    original: { url: string };
    fixed_width_small: { url: string };
  };
};

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type Props = {
  visible: boolean;
  onClose: () => void;
  
  onGifSelected: (gifUrl: string) => void;
  gifsCount: number;
};

const LIMIT = 25;

export const GiphySearchModal: React.FC<Props> = ({
  visible,
  onClose,
  onGifSelected,
  gifsCount,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // track if more results exist
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const debouncedQuery = useDebounce(query, 400);

  // To avoid race conditions, track current query ref
  const currentQueryRef = useRef(debouncedQuery);

  // Reset when query changes
  useEffect(() => {
    setResults([]);
    setOffset(0);
    setHasMore(true);
    currentQueryRef.current = debouncedQuery;
  }, [debouncedQuery]);

  const fetchGifs = async (searchQuery: string, offsetValue: number) => {
    if (!hasMore) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: GIPHY_API_KEY,
          q: searchQuery || "NBA",
          limit: LIMIT,
          offset: offsetValue,
          rating: "pg",
        },
      });
      const newData: GifItem[] = res.data.data;
      const totalCount: number = res.data.pagination.total_count;

      // Only update if query hasn't changed meanwhile
      if (currentQueryRef.current === searchQuery) {
        setResults((prev) => (offsetValue === 0 ? newData : [...prev, ...newData]));
        setHasMore(offsetValue + LIMIT < totalCount);
        setOffset(offsetValue + LIMIT);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch GIFs.");
    } finally {
      setLoading(false);
    }
  };

  // Initial load or query change
  useEffect(() => {
    fetchGifs(debouncedQuery || "NBA", 0);
  }, [debouncedQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchGifs(debouncedQuery || "NBA", offset);
    }
  };

const renderItem = useCallback(
  ({ item }: { item: GifItem }) => (
    <TouchableOpacity
      onPress={() => handleGifSelect(item)}
      style={styles.gifContainer}
    >
      <Image
        source={{ uri: item.images.fixed_width_small.url }}
        style={styles.gifImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ),
  [gifsCount] // include gifsCount or any other deps if needed
);

const handleGifSelect = (gif: GifItem) => {
  if (gifsCount >= 8) {
    Alert.alert("Limit reached", "You can only add up to 8 GIFs.");
    return;
  }
  onGifSelected(gif.images.original.url);
  onClose();
};


  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "dark" : "light"}
        style={styles.modalBackground}
      >
        <View style={[styles.container, { backgroundColor: isDark ? "#222" : "#fff" }]}>
          <View style={styles.header}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDark ? "#333" : "#eee",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              placeholder="Search GIFs"
              placeholderTextColor={isDark ? "#aaa" : "#555"}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={renderItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={() =>
              !loading && query.length >= 3 ? (
                <Text style={{ textAlign: "center", marginTop: 20, color: isDark ? "#fff" : "#000" }}>
                  No GIFs found.
                </Text>
              ) : null
            }
            ListFooterComponent={() =>
              loading ? (
                <Text style={{ textAlign: "center", paddingVertical: 10, color: isDark ? "#fff" : "#000" }}>
                  Loading...
                </Text>
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
height: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    padding: 10,
    borderRadius: 8,
  },
  closeButton: {
    marginLeft: 12,
  },
  gifContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
  },
  gifImage: {
    flex: 1,
    borderRadius: 8,
  },
});
