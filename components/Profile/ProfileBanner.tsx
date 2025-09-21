import React from "react";
import {
  GestureResponderEvent,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { getStyles } from "../../styles/ProfileScreen.styles";

type Props = {
  bannerImage?: string | null;
  profileImage?: string | null;
  isDark: boolean;
  editable?: boolean;
  onPressBanner?: (e: GestureResponderEvent) => void;
  onPressProfile?: (e: GestureResponderEvent) => void;
};

const bannerDefault = { uri: "https://via.placeholder.com/800x200.png" };
const profileDefault = { uri: "https://via.placeholder.com/120.png" };

export default function ProfileBanner({
  bannerImage,
  profileImage,
  isDark,
  editable = false,
  onPressBanner,
  onPressProfile,
}: Props) {
  const styles = getStyles(isDark);

  const BannerComponent = editable ? TouchableOpacity : View;
  const ProfileComponent = editable ? TouchableOpacity : View;

  return (
    <View style={styles.bannerContainer}>
      <BannerComponent onPress={onPressBanner} activeOpacity={0.7}>
        <Image
          source={bannerImage ? { uri: bannerImage } : bannerDefault}
          style={styles.banner}
        />
      </BannerComponent>

      <View style={styles.profilePicWrapper}>
        <ProfileComponent onPress={onPressProfile} activeOpacity={0.7}>
          <Image
            source={profileImage ? { uri: profileImage } : profileDefault}
            style={styles.profilePic}
          />
        </ProfileComponent>
      </View>
    </View>
  );
}
