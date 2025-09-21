import { useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "constants/fonts";
import { BlurView } from "expo-blur";

export default function ChatInputBar({ value, onChange, onSend }: { 
  value: string; 
  onChange: (t: string) => void; 
  onSend: () => void; 
}) {
  const isDark = useColorScheme() === "dark";
  
  const translateY = useRef(new Animated.Value(0)).current; // slide up/down
  const paddingBottom = useRef(new Animated.Value(30)).current; // animated padding

  useEffect(() => {
    const keyboardShow = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -e.endCoordinates.height,
          duration: e.duration || 250,
          useNativeDriver: true,
        }),
        Animated.timing(paddingBottom, {
          toValue: 20, // shrink padding
          duration: e.duration || 250,
          useNativeDriver: false,
        }),
      ]).start();
    });

    const keyboardHide = Keyboard.addListener("keyboardWillHide", (e) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: true,
        }),
        Animated.timing(paddingBottom, {
          toValue: 30, // reset padding
          duration: e.duration || 250,
          useNativeDriver: false,
        }),
      ]).start();
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, [translateY, paddingBottom]);

  const styles = getStyles(isDark);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Animated.View style={[styles.blurContainer, { paddingBottom }]}>
          <BlurView
            intensity={100}
            tint={"systemMaterial"}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.inputContainer}>
           <TextInput
  style={styles.input}
  placeholder="Type your message..."
  placeholderTextColor={isDark ? "#aaa" : "#555"}
  value={value}
  onChangeText={onChange}
  onSubmitEditing={onSend}
  returnKeyType="send"
  blurOnSubmit={false} // <-- prevents keyboard from closing
/>

            <TouchableOpacity onPress={onSend}>
              <Ionicons
                name="send"
                size={24}
                color={isDark ? "#fff" : "#1d1d1d"}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: "100%",
      position: "absolute",
      bottom: 0,
    },
    blurContainer: {
      overflow: "hidden",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      borderTopWidth: 1,
      borderColor: isDark ? "#333" : "#ccc",
    },
    input: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: isDark ? "#444" : "#ddd",
      color: isDark ? "#fff" : "#1d1d1d",
      fontFamily: Fonts.OSREGULAR,
    },
  });
