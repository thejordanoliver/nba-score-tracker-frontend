import { Fonts } from "constants/fonts";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Message {
  user: string;
  message: string;
  time: number;
  profile_image?: string;
  reactions?: { [emoji: string]: string[] };
}

interface Props {
  item: Message;
  index: number;
  userName: string;
  isDark: boolean;
  baseUrl: string;
  emojis: string[];
  onReaction: (index: number, emoji: string) => void;
}

export default function ChatMessage({
  item,
  index,
  userName,
  isDark,
  baseUrl,
  emojis,
  onReaction,
}: Props) {
  const time = new Date(item.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const profileUri = item.profile_image
    ? item.profile_image.startsWith("http")
      ? item.profile_image
      : `${baseUrl}/${item.profile_image}`
    : null;

  return (
    <View style={styles.messageContainer}>
      {/* User info */}
      <View style={styles.userWrapper}>
        {profileUri ? (
          <Image source={{ uri: profileUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={{ color: "#fff" }}>
              {item.user[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.user, { color: isDark ? "#fff" : "#000" }]}>
          {item.user}
        </Text>
      </View>

      {/* Message bubble */}
      <View
        style={[
          styles.messageWrapper,
          { backgroundColor: isDark ? "#444" : "#eee" },
        ]}
      >
        <Text
          style={[
            styles.message,
            { color: isDark ? "#ccc" : "#333" },
          ]}
        >
          {item.message}
        </Text>
        <Text
          style={[
            styles.time,
            { color: isDark ? "#888" : "#666" },
          ]}
        >
          {time}
        </Text>
      </View>

      {/* Reactions */}
      <View style={styles.reactionContainer}>
        {emojis.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => onReaction(index, emoji)}
            style={[
              styles.reactionButtonWrapper,
              { backgroundColor: isDark ? "#444" : "#eee" },
            ]}
          >
            <Text
              style={[
                styles.reactionButtonText,
                { color: isDark ? "#fff" : "#1d1d1d" },
                item.reactions?.[emoji]?.includes(userName) && {
                  fontWeight: "bold",
                },
              ]}
            >
              {emoji} {item.reactions?.[emoji]?.length || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: { flex: 1, paddingVertical: 8 },
  userWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  user: { fontFamily: Fonts.OSREGULAR },
  messageWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  message: { fontFamily: Fonts.OSREGULAR },
  time: {
    fontSize: 12,
    fontFamily: Fonts.OSREGULAR,
    marginTop: 4,
  },
  image: { width: 28, height: 28, borderRadius: 100, marginRight: 8 },
  placeholder: {
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionContainer: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  reactionButtonWrapper: {
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  reactionButtonText: {
    fontSize: 12,
    fontFamily: Fonts.OSREGULAR,
  },
});
