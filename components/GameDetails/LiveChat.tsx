import { Fonts } from "constants/fonts";
import { useAuth } from "hooks/useAuth";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns"; // optional helper to get date string
import { BlurView } from "expo-blur";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import ChatMessage from "./ChatMessage";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:4000";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

interface Message {
  user: string;
  message: string;
  time: number;
  profile_image?: string;
  reactions?: { [emoji: string]: string[] };
}

interface Props {
  gameId: string | number;
  onChange?: (index: number) => void;
  onSend?: (sendFn: (text: string) => void) => void;
}

export default function LiveChatBottomSheet({
  gameId,
  onChange,
  onSend,
}: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const isDark = useColorScheme() === "dark";
  const userName = user?.username ?? "Anonymous";
  const userProfile = user?.profile_image;
  const [userCount, setUserCount] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const snapPoints = useMemo(() => ["60%", "78%", "88%", "94%"], []);
  const EMOJIS = ["😂", "🔥"];
  const getTodayKey = (gameId: string | number) => {
    const today = format(new Date(), "yyyy-MM-dd");
    return `chat_${gameId}_${today}`;
  };

  // Listen to keyboard show/hide
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const addReaction = (index: number, emoji: string) => {
    const currentUser = userName;
    setMessages((prev) => {
      const newMessages = [...prev];
      const message = newMessages[index];
      if (!message.reactions) message.reactions = {};
      const users = message.reactions[emoji] || [];
      if (users.includes(currentUser)) {
        message.reactions[emoji] = users.filter((u) => u !== currentUser);
      } else {
        message.reactions[emoji] = [...users, currentUser];
      }
      return newMessages;
    });
  };

  // Expand BottomSheet after mounting
  useEffect(() => {
    if (gameId != null) {
      const timeout = setTimeout(() => bottomSheetRef.current?.expand(), 50);
      return () => clearTimeout(timeout);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [gameId]);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.emit("joinGame", gameId);
    socket.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    socket.on("userCount", setUserCount);

    return () => {
      socket.disconnect();
    };
  }, [gameId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text?.trim()) return;
      const msg: Message = {
        user: userName,
        message: text,
        time: Date.now(),
        profile_image: userProfile,
      };
      socketRef.current?.emit("sendMessage", { gameId, ...msg });
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        50
      );
    },
    [userName, userProfile, gameId]
  );

  useEffect(() => {
    if (onSend) {
      onSend(sendMessage);
    }
  }, [onSend, sendMessage]);

  useEffect(() => {
    const loadMessages = async () => {
      const key = getTodayKey(gameId);
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setMessages(JSON.parse(saved));
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          50
        );
      }
    };
    if (gameId != null) loadMessages();
  }, [gameId]);

  useEffect(() => {
  if (!gameId) return;
  const key = getTodayKey(gameId);
  AsyncStorage.setItem(key, JSON.stringify(messages));
}, [messages, gameId]);


  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <ChatMessage
      item={item}
      index={index}
      userName={userName}
      isDark={isDark}
      baseUrl={BASE_URL}
      emojis={EMOJIS}
      onReaction={addReaction}
    />
  );

  const calculatedHeight = keyboardVisible ? 390 : sheetHeight - 50;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={onChange}
      onAnimate={(fromIndex, toIndex) => {
        const point = snapPoints[toIndex];
        if (!point) return; // <-- guard for closed state

        if (point.toString().includes("%")) {
          const percent = parseFloat(point.toString()) / 100;
          const height = percent * (Dimensions.get("window").height || 0);
          setSheetHeight(height);
        } else {
          setSheetHeight(Number(point));
        }
      }}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#fff" : "#1d1d1d" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      backgroundComponent={() => (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              overflow: "hidden",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={"systemThinMaterial"}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView>
        {/* User count */}
        <View style={{ padding: 12, alignItems: "center" }}>
          <Text
            style={{
              color: isDark ? "#fff" : "#1d1d1d",
              fontFamily: Fonts.OSMEDIUM,
            }}
          >
            {userCount} {userCount === 1 ? "person" : "people"} in chat
          </Text>
        </View>

        {/* Chat messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderMessage}
          style={{ height: calculatedHeight }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      </BottomSheetView>
    </BottomSheet>
  );
}
