import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function FloatingChatButton({
  gameId,
  openChat,
}: {
  gameId: string;
  openChat: (id: string) => void;
}) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => openChat(gameId)}
      activeOpacity={0.8}
    >
      <Ionicons
        name="chatbubble"
        size={24}
        color={isDark ? "#1d1d1d" : "#fff"}
      ></Ionicons>
      {/* <Text style={styles.buttonText}>Live Chat</Text> */}
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    floatingButton: {
      alignSelf: "flex-end",
      alignContent: "center",
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: isDark ? "#fff" : "#1d1d1d",
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 4.65,
      elevation: 7,
      zIndex: 999,
      marginHorizontal: 20,
     
    },
    buttonText: {
      color: isDark ? "#1d1d1d" : "#fff",
      textAlign: "center",
      textAlignVertical: "center",
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
    },
  });
