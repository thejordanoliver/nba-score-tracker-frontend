import { Ionicons } from "@expo/vector-icons";
import { Colors } from "constants/styles";
import { Image, Text, View, useWindowDimensions } from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";
import { FALLBACK_MESSAGE_AVATAR, resolveImage } from "./utils";

type MessageThreadHeaderProps = {
  avatar?: string;
  username?: string;
  fullName?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  isDark: boolean;
};

export function MessageThreadHeader({
  avatar,
  username,
  fullName,
  isOnline,
  isVerified,
  isDark,
}: MessageThreadHeaderProps) {
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  const avatarSource = resolveImage(avatar) ?? {
    uri: FALLBACK_MESSAGE_AVATAR,
  };

  const displayUsername = username || fullName || "New Message";

  const displayFullName =
    fullName && fullName !== displayUsername ? fullName : "";

  return (
    <View style={styles.messageHeaderContainer}>
      <View style={styles.messageAvatarWrap}>
        <Image source={avatarSource} style={styles.messageAvatar} />

        {isOnline ? (
          <View
            style={[
              styles.messageOnlineDot,
              {
                borderColor: isDark ? Colors.black : Colors.white,
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.messageHeaderTextWrap}>
        <View style={styles.messageUsernameRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.messageUsername,
              {
                color: isDark ? Colors.white : Colors.black,
              },
            ]}
          >
            {displayUsername}
          </Text>

          {isVerified ? (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.dark.blue}
            />
          ) : null}
        </View>

        {displayFullName ? (
          <Text
            numberOfLines={1}
            style={[
              styles.messageFullName,
              {
                color: isDark ? Colors.lightGray : Colors.darkGray,
              },
            ]}
          >
            {displayFullName}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
