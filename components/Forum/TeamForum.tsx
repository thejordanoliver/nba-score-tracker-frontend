// components/Forum/TeamForum.tsx
import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useImagePreviewStore } from "../../store/imagePreviewStore";
import { Post, PostItem, getStyles as getPostItemStyles } from "./PostItem";
import { getAccessToken } from "utils/authStorage"; // ✅ central token getter

interface TeamForumProps {
  teamId: string;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function TeamForum({ teamId }: TeamForumProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const setGlobalImage = useImagePreviewStore((state) => state.setImages);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getPostItemStyles(isDark);

  // Load token and decode user ID
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getAccessToken(); // ✅ centralized call
        setToken(storedToken);
        if (storedToken) {
          const decoded: { id: number } = jwtDecode(storedToken);
          setCurrentUserId(decoded.id);
        }
      } catch (err) {
        console.error("Error loading token:", err);
      }
    })();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(
    async (pageNumber = 1) => {
      if (!teamId) return;

      pageNumber === 1 ? setLoading(true) : setRefreshing(true);
      setError(null);

      try {
        const res = await axios.get(`${BASE_URL}/api/forum/team/${teamId}`, {
          params: { page: pageNumber, limit: 10 },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const data = res.data;

        if (pageNumber === 1) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }

        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);

        const likedSet = new Set<string>(
          data.posts
            .filter((post: Post) => post.liked_by_current_user)
            .map((post: Post) => String(post.id))
        );

        setLikedPosts(likedSet);
      } catch (err: any) {
        setError(
          err.response?.data?.error || err.message || "Error loading posts"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teamId, token]
  );

  useEffect(() => {
    if (token) {
      fetchPosts(1);
    }
  }, [token, fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchPosts(1);
      }
    }, [fetchPosts, token])
  );

  const onRefresh = () => fetchPosts(1);

  const loadMore = () => {
    if (page < totalPages && !loading && !refreshing) {
      fetchPosts(page + 1);
    }
  };

  const deletePost = async (postId: string) => {
    if (!token) {
      alert("You must be logged in to delete posts.");
      return;
    }

    try {
      await axios.delete(`${BASE_URL}/api/forum/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      alert("Post deleted.");
    } catch (err: any) {
      alert(
        err.response?.data?.error || err.message || "Failed to delete post"
      );
    }
  };

  const editPost = async (postId: string, newText: string) => {
    if (!token) {
      alert("You must be logged in to edit posts.");
      return;
    }

    try {
      const res = await axios.patch(
        `${BASE_URL}/api/forum/post/${postId}`,
        { text: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? res.data.post : p))
      );
      alert("Post updated.");
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to edit post");
    }
  };

  useEffect(() => {
    return () => {
      setGlobalImage([], 0); // Clear global images on unmount
    };
  }, []);

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <PostItem
            item={item}
            isDark={isDark}
            styles={styles}
            token={token}
            currentUserId={currentUserId}
            deletePost={deletePost}
            editPost={editPost}
            BASE_URL={BASE_URL}
            onImagePress={(imgUri) => {
              setGlobalImage([], 0); // Reset first
              setGlobalImage([imgUri], 0);
            }}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() =>
          !loading ? (
            <Text
              style={{
                color: isDark ? "#aaa" : "#999",
                marginTop: 20,
                fontSize: 20,
                fontFamily: Fonts.OSLIGHT,
                textAlign: "center",
              }}
            >
              No posts yet.
            </Text>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          router.push({ pathname: "/create-post", params: { teamId } })
        }
        activeOpacity={0.8}
      >
        <Ionicons
          name="create"
          size={20}
          color={isDark ? "#1d1d1d" : "white"}
        />
      </TouchableOpacity>
    </View>
  );
}
