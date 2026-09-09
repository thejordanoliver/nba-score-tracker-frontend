import { useBadgeNotifications } from "@/hooks/ForumHooks/useBadgeNotifications";
import { isAxiosError } from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { AlertConfig } from "types/alert";
import type {
  ForumComposerMediaItem,
  ForumPollDraft,
  ForumPost,
  ForumPostCreateResponse,
  ForumPostDestination,
} from "types/forum";
import { apiClient } from "utils/apiClient";
import { getForumPostCreateEndpoint } from "utils/forumPostDestination";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX_MEDIA_ITEMS = 8;

const createAnim = () => ({ opacity: new Animated.Value(1) });

const createMediaId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getMimeType = (item: ForumComposerMediaItem) => {
  if (item.type === "gif") return "image/gif";

  const filename = item.uri.split("/").pop() || "";
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase();

  if (item.type === "video") {
    if (ext === "mov") return "video/quicktime";
    if (ext) return `video/${ext}`;
    return "video/mp4";
  }

  if (ext === "jpg") return "image/jpeg";
  if (ext) return `image/${ext}`;

  return "image/jpeg";
};

export function useCreatePost(destination: ForumPostDestination | null) {
  const [newPostText, setNewPostText] = useState("");
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<ForumComposerMediaItem[]>([]);
  const [mediaAnims, setMediaAnims] = useState<
    Record<string, { opacity: Animated.Value }>
  >({});
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [poll, setPoll] = useState<ForumPollDraft | null>(null);

  const router = useRouter();
  const removingRef = useRef(new Set<string>());
  const { handleBadgeAwards, requestBadgeDataRefresh } =
    useBadgeNotifications();

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  const prependPost = useCallback((post: ForumPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const addMediaItems = useCallback((items: ForumComposerMediaItem[]) => {
    if (items.length === 0) return;

    setMedia((prev) => [...prev, ...items]);

    setMediaAnims((prev) => {
      const next = { ...prev };

      items.forEach((item) => {
        next[item.id] = createAnim();
      });

      return next;
    });
  }, []);

  const pickMedia = useCallback(async () => {
    if (media.length >= MAX_MEDIA_ITEMS) {
      showAlert({
        title: "Limit reached",
        message: `You can only upload up to ${MAX_MEDIA_ITEMS} items.`,
        confirmText: "OK",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA_ITEMS - media.length,
      quality: 0.8,
    });

    if (result.canceled) return;

    const selected: ForumComposerMediaItem[] = await Promise.all(
      result.assets.map(async (asset) => {
        const id = createMediaId();

        if (asset.type === "video") {
          try {
            const { uri: thumbnailUri } =
              await VideoThumbnails.getThumbnailAsync(asset.uri, {
                time: 0,
                quality: 0.8,
              });

            return {
              id,
              uri: asset.uri,
              type: "video",
              thumbnailUri,
              trimStartMs: 0,
            };
          } catch {
            return {
              id,
              uri: asset.uri,
              type: "video",
            };
          }
        }

        return {
          id,
          uri: asset.uri,
          type: "image",
        };
      }),
    );

    addMediaItems(selected);
  }, [addMediaItems, media.length, showAlert]);

  const addGif = useCallback(
    (gifUrl: string) => {
      if (!gifUrl) return;

      if (media.length >= MAX_MEDIA_ITEMS) {
        showAlert({
          title: "Limit reached",
          message: `You can only add up to ${MAX_MEDIA_ITEMS} media items.`,
          confirmText: "OK",
        });
        return;
      }

      addMediaItems([
        {
          id: createMediaId(),
          uri: gifUrl,
          type: "gif",
        },
      ]);
    },
    [addMediaItems, media.length, showAlert],
  );

  const removeMedia = useCallback(
    (id: string) => {
      if (removingRef.current.has(id)) return;

      const anim = mediaAnims[id];
      if (!anim) return;

      const itemExists = media.find((m) => m.id === id);
      if (!itemExists) return;

      removingRef.current.add(id);

      Animated.timing(anim.opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        LayoutAnimation.configureNext({
          duration: 350,
          create: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
          update: {
            type: LayoutAnimation.Types.easeInEaseOut,
            springDamping: 0.7,
          },
          delete: {
            type: LayoutAnimation.Types.easeInEaseOut,
            property: LayoutAnimation.Properties.opacity,
          },
        });

        setMedia((prev) => prev.filter((item) => item.id !== id));

        setMediaAnims((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });

        removingRef.current.delete(id);
      });
    },
    [media, mediaAnims],
  );

  const createPost = useCallback(async () => {
    if (!destination) {
      showAlert({
        title: "Choose where to post",
        message: "Select a team or league before publishing your post.",
        confirmText: "OK",
      });
      return null;
    }

    const hasText = newPostText.trim().length > 0;
    const hasMedia = media.length > 0;
    const hasPoll = !!poll;

    if (!hasText && !hasMedia && !hasPoll) {
      showAlert({
        title: "Empty post",
        message: "Add text, media, a GIF, or a poll before posting.",
        confirmText: "OK",
      });
      return null;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("text", newPostText.trim());
    formData.append("league", destination.league);

    if (poll) {
      formData.append(
        "poll",
        JSON.stringify({
          question: poll.question,
          options: poll.options.map((o) => o.text),
          allowsMultiple: poll.allowsMultiple,
        }),
      );
    }

    const gifUrls = media
      .filter((item) => item.type === "gif")
      .map((item) => item.uri);

    if (gifUrls.length > 0) {
      formData.append("gif_urls", JSON.stringify(gifUrls));

      gifUrls.forEach((gifUrl) => {
        formData.append("gif_url", gifUrl);
      });
    }

    media.forEach((item, idx) => {
      if (item.type === "gif") return;

      const fallbackExt = item.type === "video" ? "mp4" : "jpg";
      const fallbackName = `${item.type}-${idx}.${fallbackExt}`;
      const filename = item.uri.split("/").pop() || fallbackName;

      formData.append("media", {
        uri: item.uri,
        name: filename,
        type: getMimeType(item),
      } as unknown as Blob);

      if (item.type === "video") {
        if (item.thumbnailUri) {
          const thumbName =
            item.thumbnailUri.split("/").pop() || `thumb-${idx}.jpg`;

          formData.append("thumbnails", {
            uri: item.thumbnailUri,
            name: thumbName,
            type: "image/jpeg",
          } as unknown as Blob);
        }

        formData.append(
          "trimMeta",
          JSON.stringify({
            idx,
            startMs: item.trimStartMs ?? 0,
            endMs: item.trimEndMs ?? null,
          }),
        );
      }
    });

    try {
      const endpoint = getForumPostCreateEndpoint(destination);

      const res = await apiClient.post<
        ForumPostCreateResponse<ForumPost, unknown>
      >(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { post: newPost, newlyAwardedBadges } = res.data;

      if (!newPost) {
        throw new Error("The post response was missing the created post.");
      }

      handleBadgeAwards(newlyAwardedBadges);

      if (!newlyAwardedBadges?.length) {
        requestBadgeDataRefresh();
      }

      prependPost(newPost);
      setPoll(null);
      setNewPostText("");
      setMedia([]);
      setMediaAnims({});

      showAlert({
        title: "Success",
        message: "Post created!",
        confirmText: "OK",
        onConfirm: () => router.back(),
      });

      return newPost;
    } catch (err: unknown) {
      let errorMessage = "Please try again later.";

      if (isAxiosError<{ error?: string }>(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          errorMessage = "You must be logged in to create a post.";
        } else if (err.response?.status === 413) {
          errorMessage = "Media files are too large. Please reduce file size.";
        } else if (err.response?.status === 400) {
          errorMessage = err.response.data?.error || "Invalid post data.";
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      showAlert({
        title: "Failed to create post",
        message: errorMessage,
        confirmText: "OK",
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [
    media,
    newPostText,
    destination,
    poll,
    handleBadgeAwards,
    prependPost,
    requestBadgeDataRefresh,
    router,
    showAlert,
  ]);

  return {
    newPostText,
    setNewPostText,
    media,
    mediaAnims,
    loading,
    pickMedia,
    addGif,
    removeMedia,
    createPost,
    prependPost,
    alertConfig,
    showAlert,
    closeAlert,
    setMedia,
    setMediaAnims,
    posts,
    poll,
    setPoll,
  };
}
