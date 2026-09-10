import { GestureResponderEvent } from "react-native";

export type Mode = "followers" | "following";

export type User = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  profile_image?: string;
  banner_image?: string | null; // add this
  bio?: string | null;
};

export type PrivateAccountUser = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  bio: string;
  profileImage: string | null;
  bannerImage: string | null;
  showActivityStatus: boolean;
  createdAt: string;
};

export type Follow = {
  followersCount: number;
  followingCount: number;
  isDark: boolean;
  currentUserId: string;
  targetUserId: string;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
};

export type ProfileBannerProps = {
  bannerImage?: string | null;
  profileImage?: string | null;
  isDark: boolean;
  editable?: boolean;
  onPressBanner?: (e: GestureResponderEvent) => void;
  onPressProfile?: (e: GestureResponderEvent) => void;
};
