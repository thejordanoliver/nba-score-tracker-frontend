import type { AlertConfig } from "./alert";
import type { BadgeMutationResponse } from "./badges";
import type { LeagueType } from "./types";

export type ForumMediaType = "image" | "video" | "gif";

export type ForumUser = {
  id: string;
  name: string;
  avatar: string;
  username: string;
};

export type ForumPost = {
  id: string;
  username: string;
  full_name: string | null;
  profile_image: string | null;
  text: string;
  likes: number;
  bookmarks?: number;
  shares: number;
  comments_count: number;
  created_at: string;
  user_id: number;
  liked_by_current_user: boolean;
  bookmarked_by_current_user?: boolean;
  bookmarked?: boolean;
  images?: string[];
  videos?: string[];
  video_thumbnails?: (string | null)[];
};

export type ForumPostAuthor = {
  id: number;
  username: string;
};

export type ForumExtendedPost = ForumPost & {
  author?: ForumPostAuthor;
};

export type ForumComment = {
  id: number;
  post_id: string;
  user_id: number;
  parent_comment_id: number | null;
  username: string;
  full_name?: string | null;
  profile_image?: string | null;
  text: string | null;
  images?: string[];
  videos?: string[];
  video_thumbnails?: (string | null)[];
  created_at: string;
  edited_at?: string | null;
  replies?: ForumComment[];
};

export type ForumCommentAttachment = {
  type: ForumMediaType;
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type ForumDisplayMediaItem = {
  id: string;
  uri: string;
  type: "image" | "video";
  thumbnailUri?: string;
  trimStartMs?: number;
  trimEndMs?: number;
};

export type ForumComposerMediaItem = Omit<ForumDisplayMediaItem, "type"> & {
  type: ForumMediaType;
};

export type ForumPollDraftOption = {
  id: string;
  text: string;
};

export type ForumPollDraft = {
  question: string;
  options: ForumPollDraftOption[];
  allowsMultiple: boolean;
};

export type ForumPollOption = {
  id: number;
  text: string;
  vote_count: number;
  voted_by_current_user: boolean;
};

export type ForumPollState = {
  id: string;
  question: string;
  allows_multiple: boolean;
  expires_at: string | null;
  options: ForumPollOption[];
};

export type ForumLegacyPost = {
  id: string;
  teamId: string;
  text: string;
  images: string[];
  videos: string[];
  user: ForumUser;
  likes: number;
  liked: boolean;
  comments: number;
  commented: boolean;
  bookmarks: number;
  bookmarked: boolean;
  shares: number;
  shared: boolean;
  createdAt: string;
  editedAt?: string;
};

export type ForumLegacyComment = {
  id: string;
  user: ForumUser;
  text: string;
  createdAt: string;
  editedAt?: string;
};

export type ForumPagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type ForumPostsResponse<TPost = ForumPost> = {
  posts?: TPost[];
  pagination?: ForumPagination;
};

export type ForumPostResponse<TPost = ForumPost> = {
  post?: TPost;
};

export type ForumCommentsResponse<TComment = ForumComment> = {
  comments?: TComment[];
  pagination?: ForumPagination;
};

export type ForumPollResponse<TPoll = ForumPollState> = {
  poll?: TPoll | null;
};

export type ForumPostCreateResponse<TPost = unknown, TPoll = unknown> =
  BadgeMutationResponse & {
    post: TPost;
    poll?: TPoll | null;
  };

/**
 * Shared response type used by:
 *
 * POST /post/:postId/comments
 *   -> returns { comment: ... }
 *
 * POST /post/:postId/comments/:commentId/replies
 *   -> returns { reply: ... }
 *
 * PUT /post/:postId/comments/:commentId
 *   -> returns { comment: ... }
 *
 * `comment` and `reply` are intentionally optional because the exact payload
 * depends on which mutation endpoint was called. Callers must validate the
 * expected property before normalizing it.
 */
export type ForumCommentCreateResponse<TComment = unknown> =
  BadgeMutationResponse & {
    message?: string;
    comment?: TComment;
    reply?: TComment;
    post?: ForumPost;
  };

export type ForumLikeMutationResponse<TPost = unknown> =
  BadgeMutationResponse & {
    post: TPost;
    didChangeLike: boolean;
  };

export type ForumShareMutationResponse<TPost = unknown> =
  BadgeMutationResponse & {
    post: TPost;
    didCreateShare: boolean;
  };

export type ForumBookmarkMutationResponse<TPost = unknown> = {
  post?: TPost;
  didChangeBookmark?: boolean;
};

export type ForumDeleteMutationResponse<
  TDeleted = unknown,
  TPost = ForumPost,
> = {
  message?: string;
  comment?: TDeleted;
  post?: TPost;
};

export type ForumPostUpdateResponse<TPost = ForumPost> = {
  post?: TPost;
};

export type ForumPostDestination =
  | {
      kind: "league";
      league: LeagueType;
    }
  | {
      kind: "team";
      league: LeagueType;
      teamId: string;
    };

export type UseForumOptions = {
  teamId?: string;
  league?: string;
};

export type UseBookmarkedPostsOptions = {
  enabled?: boolean;
  limit?: number;
};

export type UseLeagueForumPostsParams = {
  teamId: string;
  league?: LeagueType;
};

export type ForumLoadMoreMode = "automatic" | "button";

export type ForumProps = {
  posts: ForumPost[];
  currentUserId: number | null;
  isDark: boolean;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
  onDeletePost: (postId: string) => void | Promise<void>;
  onEditPost: (postId: string, newText: string) => void | Promise<void>;
  onBookmarkChange?: (post: ForumPost, bookmarked: boolean) => void;
  onImagePress?: (uri: string, caption?: string) => void;
  showCreateButton?: boolean;
  onCreatePost?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  scrollEnabled?: boolean;
  loadMoreMode?: ForumLoadMoreMode;
  skeletonCount?: number;
};

export type ForumPostItemProps = {
  item: ForumPost;
  isDark: boolean;
  currentUserId: number | null;
  deletePost: (postId: string) => void | Promise<void>;
  editPost: (postId: string, newText: string) => void | Promise<void>;
  onImagePress?: (uri: string, caption?: string) => void;
  onBookmarkChange?: (post: ForumPost, bookmarked: boolean) => void;
  disableCommentNavigation?: boolean;
};

export type ForumActionSubmenuProps = {
  visible: boolean;
  isDark: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export type ForumPostImageItem = {
  id: string;
  text?: string;
  likes: number;
  comments_count?: number;
  liked_by_current_user?: boolean;
  username?: string;
  profile_image: string | null;
  user_id: number;
};

export type ForumPostImagesProps = {
  media: ForumDisplayMediaItem[];
  currentUserId: number | null;
  item: ForumPostImageItem;
};

export type ForumPostImagesModalProps = {
  visible: boolean;
  postId: string;
  media: ForumDisplayMediaItem[];
  initialIndex: number;
  onClose: () => void;
  postText?: string;
  likesCount?: number;
  commentsCount?: number;
  likedByCurrentUser?: boolean;
  profileImage?: string | null;
  username?: string;
  postAuthorUserId: number;
  currentUserId: number | null;
};

export type ForumCommentItemProps = {
  comment: ForumComment;
  postId: string;
  isDark: boolean;
  currentUserId: number | null;
  editComment: (commentId: number, newText: string) => Promise<void>;
  deleteComment: (postId: string, commentId: number) => Promise<void>;
  onReply?: (comment: ForumComment) => void;
  isReply?: boolean;
  isLast: boolean;
};

export type ForumPollEditorModalProps = {
  visible: boolean;
  initial?: ForumPollDraft | null;
  onClose: () => void;
  onSave: (poll: ForumPollDraft) => void;
};

export type ForumVideoEditorSavePayload = {
  thumbnailUri: string;
  trimStartMs: number;
  trimEndMs: number;
};

export type ForumVideoEditorModalProps = {
  visible: boolean;
  videoUri: string;
  initialThumbnailUri?: string;
  initialTrimStartMs?: number;
  initialTrimEndMs?: number;
  onClose: () => void;
  onSave: (payload: ForumVideoEditorSavePayload) => void;
};

export type ForumPostButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  title: string;
};

export type ForumPostItemSkeletonProps = {
  showMedia?: boolean;
};

export type ForumAlertConfig = AlertConfig;
