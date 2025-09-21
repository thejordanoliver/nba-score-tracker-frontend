import { useState, useEffect, useCallback } from "react";
import axios from "axios";

type User = {
  id: string;
  name: string;
  avatar: string;
  username: string;
};

export type Post = {
  id: string;
  teamId: string;
  text: string;
  images: string[];
  videos: string[];
  user: User;
  likes: number;
  liked: boolean;       // You might want to maintain this client-side or via auth
  comments: number;
  commented: boolean;   // Likewise, client-side only
  bookmarks: number;
  bookmarked: boolean;  // Client-side only unless implemented on backend
  shares: number;
  shared: boolean;
  createdAt: string;
  editedAt?: string;
};

export type Comment = {
  id: string;
  user: User;
  text: string;
  createdAt: string;
  editedAt?: string;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export function useForumPosts(teamId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/api/forum/${teamId}`);
      setPosts(res.data.posts);
    } catch (err: any) {
      setError(err.message || "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Create post
  const createPost = useCallback(
    async (text: string, images: string[] = [], videos: string[] = [], user: User) => {
      try {
        const res = await axios.post(`${BASE_URL}/api/forum/${teamId}`, {
          text,
          images,
          videos,
          user,
        });
        setPosts((prev) => [res.data.post, ...prev]);
      } catch (err: any) {
        setError(err.message || "Failed to create post");
      }
    },
    [teamId]
  );

  // Edit post
  const editPost = useCallback(
    async (postId: string, updates: Partial<Pick<Post, "text" | "images" | "videos">>) => {
      try {
        const res = await axios.put(`${BASE_URL}/api/forum/${postId}`, updates);
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data.post : p)));
      } catch (err: any) {
        setError(err.message || "Failed to update post");
      }
    },
    []
  );

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    try {
      await axios.delete(`${BASE_URL}/api/forum/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      setError(err.message || "Failed to delete post");
    }
  }, []);

  // Toggle like (expects current liked state, toggles it)
  const toggleLike = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      try {
        // Send explicit like state to backend (true to like, false to unlike)
        const res = await axios.patch(`${BASE_URL}/api/forum/${postId}/like`, {
          like: !currentlyLiked,
        });
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data.post : p)));
      } catch (err: any) {
        setError(err.message || "Failed to toggle like");
      }
    },
    []
  );

  // Toggle bookmark (expects current bookmarked state, toggles it)
  const toggleBookmark = useCallback(
    async (postId: string, currentlyBookmarked: boolean) => {
      try {
        const res = await axios.patch(`${BASE_URL}/api/forum/${postId}/bookmark`, {
          bookmark: !currentlyBookmarked,
        });
        setPosts((prev) => prev.map((p) => (p.id === postId ? res.data.post : p)));
      } catch (err: any) {
        setError(err.message || "Failed to toggle bookmark");
      }
    },
    []
  );

  // Remove toggleComment (dummy count) since backend manages comment counts

  // Fetch all comments
  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    try {
      const res = await axios.get(`${BASE_URL}/api/forum/${postId}/comments`);
      return res.data.comments;
    } catch (err: any) {
      setError(err.message || "Failed to fetch comments");
      return [];
    }
  }, []);

  // Add comment
  const addComment = useCallback(
    async (postId: string, user: User, text: string): Promise<Comment | null> => {
      try {
        const res = await axios.post(`${BASE_URL}/api/forum/${postId}/comments`, {
          user,
          text,
        });
        // Optionally refresh posts to update comment count after adding comment
        await fetchPosts();
        return res.data.comment;
      } catch (err: any) {
        setError(err.message || "Failed to add comment");
        return null;
      }
    },
    [fetchPosts]
  );

  // Edit comment
  const editComment = useCallback(
    async (postId: string, commentId: string, text: string): Promise<Comment | null> => {
      try {
        const res = await axios.put(`${BASE_URL}/api/forum/${postId}/comments/${commentId}`, {
          text,
        });
        return res.data.comment;
      } catch (err: any) {
        setError(err.message || "Failed to edit comment");
        return null;
      }
    },
    []
  );

  // Delete comment
  const deleteComment = useCallback(
    async (postId: string, commentId: string): Promise<boolean> => {
      try {
        await axios.delete(`${BASE_URL}/api/forum/${postId}/comments/${commentId}`);
        // Refresh posts to update comment counts
        await fetchPosts();
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to delete comment");
        return false;
      }
    },
    [fetchPosts]
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
