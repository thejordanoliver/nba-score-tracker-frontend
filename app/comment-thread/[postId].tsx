//comment-thread/[postId].tsx

import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { CommentItem } from "components/Forum/CommentItem";
import { Post, PostItem, getStyles } from "components/Forum/PostItem";
import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { jwtDecode } from "jwt-decode";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { getAccessToken } from "utils/authStorage"; // <-- use your helper

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

interface Comment {
  id: string;
  text: string;
  user_id: number;
  username: string;
  created_at: string;
  profile_image: string;
}

interface ExtendedPost extends Post {
  author: { id: number; username: string };
}

interface JwtPayload {
  id: number;
}

function mapCommentToPost(comment: Comment): Post {
  return {
    id: comment.id,
    text: comment.text,
    user_id: comment.user_id,
    username: comment.username,
    created_at: comment.created_at,
    full_name: null,
    profile_image: comment.profile_image,
    likes: 0,
    comments_count: 0,
    liked_by_current_user: false,
    images: [],
  };
}

export default function CommentThreadScreen() {
  const params = useLocalSearchParams();
  const postId = typeof params.postId === "string" ? params.postId : null;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const navigation = useNavigation();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [post, setPost] = useState<ExtendedPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputHeight, setInputHeight] = useState(40); // default height

useEffect(() => {
  const loadToken = async () => {
    const storedToken = await getAccessToken();
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        setCurrentUserId(decoded.id);
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
  };
  loadToken();
}, []);


  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="Comments" onBack={goBack} />,
    });
  }, [navigation]);


 const fetchThread = async () => {
  if (!postId) return;
  setLoading(true);
  try {
    const [postRes, commentRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/forum/post/${postId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
      axios.get(`${BASE_URL}/api/forum/post/${postId}/comments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    ]);
    setPost(postRes.data.post);
    setComments(commentRes.data.comments);
  } catch (err) {
    console.error("Failed to fetch thread", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (postId) {
      fetchThread();
    }
  }, [postId]);

  const postComment = async () => {
    if (!token || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/forum/post/${postId}/comments`,
        { text: newComment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [res.data.comment, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmitting(false);
    }
  };


  const deletePost = async (postIdToDelete: string) => {
    if (!token || !postIdToDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/forum/post/${postIdToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.back(); // Go back after successful delete
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };
  async function editComment(commentId: string, newText: string) {
    if (!token) {
      alert("You must be logged in to edit a comment");
      return;
    }

    try {
      await axios.put(
        `${BASE_URL}/api/forum/post/${postId}/comments/${commentId}`,
        { text: newText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId ? { ...comment, text: newText } : comment
        )
      );
    } catch (err) {
      console.error("Failed to edit comment", err);
      alert("Failed to edit comment");
    }
  }

  async function deleteComment(commentId: string) {
    if (!token) {
      alert("You must be logged in to delete a comment");
      return;
    }
    try {
      await axios.delete(
        `${BASE_URL}/api/forum/post/${postId}/comments/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prevComments) =>
        prevComments.filter((c) => c.id !== commentId)
      );
    } catch (err) {
      alert("Failed to delete comment");
    }
  }

  if (!postId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: isDark ? "#fff" : "#000" }}>Invalid post ID</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color={isDark ? "#fff" : "#000"} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0} // adjust for header height
    >
    
        <FlatList
          data={comments.map(mapCommentToPost)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              isDark={isDark}
              BASE_URL={BASE_URL}
              currentUserId={currentUserId ?? ""}
              editComment={editComment}
              deleteComment={deleteComment}
            />
          )}
          ListHeaderComponent={
            post ? (
              <PostItem
                item={post}
                isDark={isDark}
                token={token}
                currentUserId={currentUserId}
                deletePost={deletePost}
                editPost={() => {}}
                BASE_URL={BASE_URL}
                styles={getStyles(isDark)}
                onImagePress={() => {}}
              />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input bar positioned at bottom */}
        <BlurView
          intensity={80}
          tint={"systemUltraThinMaterial"}
          style={{
            padding: 16,
        paddingBottom: 30,
            flexDirection: "row",
          
          }}
        >
          <TextInput
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            onContentSizeChange={(event) => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            style={{
              color: isDark ? "#fff" : "#000",
              backgroundColor: isDark ? "#222" : "#f0f0f0",
              paddingVertical: 12,
              paddingHorizontal: 16,
              flex: 1,
              fontFamily: Fonts.OSREGULAR,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
            
            }}
            placeholderTextColor={isDark ? "#888" : "#666"}
          />
          <TouchableOpacity
            onPress={postComment}
            disabled={submitting}
            style={{
              backgroundColor: isDark ? "#fff" : "#1d1d1d",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="send"
              color={isDark ? "#1d1d1d" : "#fff"}
              size={22}
            />
          </TouchableOpacity>
        </BlurView>

    </KeyboardAvoidingView>
  );
}
