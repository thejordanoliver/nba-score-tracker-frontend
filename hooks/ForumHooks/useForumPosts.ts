import { useBadgeNotifications } from "@/hooks/ForumHooks/useBadgeNotifications";
import { useCallback, useEffect, useState } from "react";
import type {
  ForumBookmarkMutationResponse,
  ForumCommentCreateResponse,
  ForumCommentsResponse,
  ForumLegacyComment,
  ForumLegacyPost,
  ForumLikeMutationResponse,
  ForumPostCreateResponse,
  ForumPostUpdateResponse,
  ForumPostsResponse,
  ForumUser,
} from "types/forum";
import { apiClient } from "utils/apiClient";

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

export function useForumPosts(teamId: string) {
  const [posts, setPosts] = useState<ForumLegacyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleBadgeAwards, requestBadgeDataRefresh } =
    useBadgeNotifications();

  const handleAwardsOrRefresh = useCallback(
    (newlyAwardedBadges?: ForumPostCreateResponse["newlyAwardedBadges"]) => {
      handleBadgeAwards(newlyAwardedBadges);

      if (!newlyAwardedBadges?.length) {
        requestBadgeDataRefresh();
      }
    },
    [handleBadgeAwards, requestBadgeDataRefresh],
  );

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<ForumPostsResponse<ForumLegacyPost>>(
        `/api/forum/${teamId}`,
      );
      setPosts(res.data.posts ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch posts"));
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const createPost = useCallback(
    async (
      text: string,
      images: string[] = [],
      videos: string[] = [],
      user: ForumUser,
    ) => {
      try {
        const res = await apiClient.post<
          ForumPostCreateResponse<ForumLegacyPost>
        >(`/api/forum/${teamId}`, {
          text,
          images,
          videos,
          user,
        });

        setPosts((prev) => [res.data.post, ...prev]);
        handleAwardsOrRefresh(res.data.newlyAwardedBadges);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to create post"));
      }
    },
    [handleAwardsOrRefresh, teamId],
  );

  const editPost = useCallback(
    async (
      postId: string,
      updates: Partial<Pick<ForumLegacyPost, "text" | "images" | "videos">>,
    ) => {
      try {
        const res = await apiClient.put<
          ForumPostUpdateResponse<ForumLegacyPost>
        >(`/api/forum/${postId}`, updates);
        const updatedPost = res.data.post;

        if (updatedPost) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? updatedPost : p)),
          );
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to update post"));
      }
    },
    [],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      try {
        await apiClient.delete(`/api/forum/${postId}`);
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        requestBadgeDataRefresh();
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to delete post"));
      }
    },
    [requestBadgeDataRefresh],
  );

  const toggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      try {
        const res = await apiClient.patch<
          ForumLikeMutationResponse<ForumLegacyPost>
        >(`/api/forum/${postId}/like`, {
          like: !currentlyLiked,
        });

        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? res.data.post : p)),
        );
        handleAwardsOrRefresh(res.data.newlyAwardedBadges);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to toggle like"));
      }
    },
    [handleAwardsOrRefresh],
  );

  const toggleBookmark = useCallback(
    async (postId: string, currentlyBookmarked: boolean) => {
      try {
        const res = await apiClient.patch<
          ForumBookmarkMutationResponse<ForumLegacyPost>
        >(`/api/forum/${postId}/bookmark`, {
          bookmark: !currentlyBookmarked,
        });
        const updatedPost = res.data.post;

        if (updatedPost) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? updatedPost : p)),
          );
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to toggle bookmark"));
      }
    },
    [],
  );

  const fetchComments = useCallback(
    async (postId: string): Promise<ForumLegacyComment[]> => {
      try {
        const res = await apiClient.get<
          ForumCommentsResponse<ForumLegacyComment>
        >(`/api/forum/${postId}/comments`);

        return res.data.comments ?? [];
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to fetch comments"));
        return [];
      }
    },
    [],
  );

  const addComment = useCallback(
    async (
      postId: string,
      user: ForumUser,
      text: string,
    ): Promise<ForumLegacyComment | null> => {
      try {
        const res = await apiClient.post<
          ForumCommentCreateResponse<ForumLegacyComment>
        >(`/api/forum/${postId}/comments`, {
          user,
          text,
        });

        handleAwardsOrRefresh(res.data.newlyAwardedBadges);
        await fetchPosts();
        return res.data.comment ?? null;
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to add comment"));
        return null;
      }
    },
    [fetchPosts, handleAwardsOrRefresh],
  );

  const editComment = useCallback(
    async (
      postId: string,
      commentId: string,
      text: string,
    ): Promise<ForumLegacyComment | null> => {
      try {
        const res = await apiClient.put<
          ForumCommentCreateResponse<ForumLegacyComment>
        >(`/api/forum/${postId}/comments/${commentId}`, {
          text,
        });

        return res.data.comment ?? null;
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to edit comment"));
        return null;
      }
    },
    [],
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string): Promise<boolean> => {
      try {
        await apiClient.delete(`/api/forum/${postId}/comments/${commentId}`);
        requestBadgeDataRefresh();
        await fetchPosts();
        return true;
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to delete comment"));
        return false;
      }
    },
    [fetchPosts, requestBadgeDataRefresh],
  );

  useEffect(() => {
    if (teamId) fetchPosts();
  }, [teamId, fetchPosts]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    editPost,
    deletePost,
    toggleLike,
    toggleBookmark,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
  };
}
