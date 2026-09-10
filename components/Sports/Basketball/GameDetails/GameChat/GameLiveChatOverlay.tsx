import LiveChat from "@/components/Sports/Basketball/GameDetails/GameChat/LiveChat";
import { useLiveGameChat } from "hooks/useLiveGameChat";
import { memo, useCallback, useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import type { ChatMessageItem } from "types/chat";
import type { ChatSendPayload } from "utils/chatPayload";
import FloatingButton from "../../../../Buttons/FloatingButton";

type GameChatSessionProps = {
  messages: ChatMessageItem[];
  userCount: number;
  currentUserName: string;
  isReady: boolean;
  sendMessage: (payload: ChatSendPayload) => boolean;
  addReaction: (messageId: string, emoji: string) => void;
  onClose: () => void;
};

type GameLiveChat = {
  gameId: string;
  opacityAnim: Animated.Value;
  state?: string | null;
};

type MountedGameLiveChatOverlayProps = {
  gameId: string;
  opacityAnim: Animated.Value;
  chatOpen: boolean;
  onOpenChat: () => void;
  onCloseChat: () => void;
};

const GameChatSession = memo(function GameChatSession({
  messages,
  userCount,
  currentUserName,
  isReady,
  sendMessage,
  addReaction,
  onClose,
}: GameChatSessionProps) {
  const handleSend = useCallback(
    async (payload: ChatSendPayload) => {
      return sendMessage(payload);
    },
    [sendMessage],
  );

  return (
    <LiveChat
      messages={messages}
      userCount={userCount}
      currentUserName={currentUserName}
      onReaction={addReaction}
      onSend={handleSend}
      sendDisabled={!isReady}
      onDismiss={onClose}
    />
  );
});

function MountedGameLiveChatOverlay({
  gameId,
  opacityAnim,
  chatOpen,
  onOpenChat,
  onCloseChat,
}: MountedGameLiveChatOverlayProps) {
  const {
    messages,
    userCount,
    currentUserName,
    isReady,
    sendMessage,
    addReaction,
  } = useLiveGameChat(gameId);

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.floatingButtonLayer, { opacity: opacityAnim }]}
      >
        <FloatingButton
          isOpen={chatOpen}
          onPress={onOpenChat}
          icon={"chatbubble"}
        />
      </Animated.View>

      {chatOpen && (
        <GameChatSession
          messages={messages}
          userCount={userCount}
          currentUserName={currentUserName}
          isReady={isReady}
          sendMessage={sendMessage}
          addReaction={addReaction}
          onClose={onCloseChat}
        />
      )}
    </>
  );
}

export default function GameLiveChatOverlay({
  gameId,
  state,
  opacityAnim,
}: GameLiveChat) {
  const [chatOpen, setChatOpen] = useState(false);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
  }, []);

  const handleOpenChat = useCallback(() => {
    setChatOpen(true);
  }, []);

  useEffect(() => {
    setChatOpen(false);
  }, [gameId]);

  if (state === "post") return null;

  return (
    <MountedGameLiveChatOverlay
      gameId={gameId}
      opacityAnim={opacityAnim}
      chatOpen={chatOpen}
      onOpenChat={handleOpenChat}
      onCloseChat={handleCloseChat}
    />
  );
}

const styles = StyleSheet.create({
  floatingButtonLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
});
