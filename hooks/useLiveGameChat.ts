import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "hooks/UserHooks/useAuth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ChatMessageItem,
  GameChatHistoryResponse,
  GameChatReactionUpdate,
  IncomingChatMessage,
  SendGameChatMessageAck,
  SendGameChatMessagePayload,
  ToggleGameChatReactionAck,
  ToggleGameChatReactionPayload,
} from "types/chat";
import { apiClient, getAccessToken } from "utils/apiClient";
import { getSocketNamespaceUrl } from "utils/apiConfig";
import { buildChatPayload, type ChatSendPayload } from "utils/chatPayload";
import {
  areSameChatMessage,
  createClientMessage,
  createSendPayloadKey,
  dedupeMessages,
  mergeChatMessages,
  normalizeMessage,
  normalizeProfileImage,
} from "utils/chatUtils";

const SOCKET_NAMESPACE = "";
const SOCKET_URL = getSocketNamespaceUrl(SOCKET_NAMESPACE);
const DUPLICATE_SEND_BLOCK_MS = 800;

type GameChatServerToClientEvents = {
  receiveMessage: (message: IncomingChatMessage) => void;
  userCount: (count: number) => void;
  reactionUpdated: (payload: GameChatReactionUpdate) => void;
};

type GameChatClientToServerEvents = {
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  sendMessage: (
    payload: SendGameChatMessagePayload,
    ack?: (response: SendGameChatMessageAck) => void,
  ) => void;
  toggleReaction: (
    payload: ToggleGameChatReactionPayload,
    ack?: (response: ToggleGameChatReactionAck) => void,
  ) => void;
};

type GameChatSocket = Socket<
  GameChatServerToClientEvents,
  GameChatClientToServerEvents
>;

const sortMessages = (messages: ChatMessageItem[]) =>
  [...messages].sort((a, b) => a.time - b.time);

const mergeMessageList = (messages: ChatMessageItem[]) =>
  sortMessages(dedupeMessages(messages));

export function useLiveGameChat(gameId: string | number) {
  const { user } = useAuth();
  const socketRef = useRef<GameChatSocket | null>(null);
  const recentSendRef = useRef<{ key: string; time: number } | null>(null);
  const historySyncInFlightRef = useRef(false);
  const historySyncRequestedRef = useRef(false);
  const activeRoomRef = useRef("");

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  const roomId = useMemo(() => String(gameId), [gameId]);
  const storageKey = useMemo(() => `chat_${roomId}`, [roomId]);

  const currentUserName = user?.username?.trim() || "Anonymous";
  const currentUserProfileImage = normalizeProfileImage(user?.profile_image);

  const upsertMessage = useCallback((incomingMessage: IncomingChatMessage) => {
    const normalizedMessage = normalizeMessage(incomingMessage);
    if (!normalizedMessage) return false;

    setMessages((prevMessages) => {
      const existingIndex = prevMessages.findIndex((message) =>
        areSameChatMessage(message, normalizedMessage),
      );

      if (existingIndex === -1) {
        return mergeMessageList([...prevMessages, normalizedMessage]);
      }

      const mergedMessage = mergeChatMessages(
        prevMessages[existingIndex],
        normalizedMessage,
      );

      if (mergedMessage === prevMessages[existingIndex]) {
        return prevMessages;
      }

      const nextMessages = [...prevMessages];
      nextMessages[existingIndex] = mergedMessage;
      return mergeMessageList(nextMessages);
    });

    return true;
  }, []);

  const applyReactionUpdate = useCallback(
    (payload: GameChatReactionUpdate | ToggleGameChatReactionAck) => {
      if ("ok" in payload && !payload.ok) return;

      const messageId = payload.messageId;
      const reactions = payload.reactions;

      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === messageId || message.clientId === messageId
            ? {
                ...message,
                reactions,
              }
            : message,
        ),
      );
    },
    [],
  );

  const removeOptimisticMessage = useCallback((clientId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter(
        (message) => message.id !== clientId && message.clientId !== clientId,
      ),
    );
  }, []);

  const syncHistory = useCallback(async () => {
    if (historySyncInFlightRef.current) {
      historySyncRequestedRef.current = true;
      return;
    }

    historySyncInFlightRef.current = true;

    try {
      do {
        historySyncRequestedRef.current = false;

        const requestRoomId = roomId;
        const response = await apiClient.get<GameChatHistoryResponse>(
          `/api/game-chat/${encodeURIComponent(requestRoomId)}/messages`,
        );

        if (activeRoomRef.current !== requestRoomId) {
          return;
        }

        const serverMessages = response.data.messages
          .map((message) => normalizeMessage(message))
          .filter((message): message is ChatMessageItem => message !== null);

        setMessages((currentMessages) =>
          mergeMessageList([...serverMessages, ...currentMessages]),
        );
      } while (historySyncRequestedRef.current);
    } catch (error) {
      console.warn("Failed to sync live chat history", error);
    } finally {
      historySyncInFlightRef.current = false;
    }
  }, [roomId]);

  useEffect(() => {
    let isMounted = true;
    activeRoomRef.current = roomId;
    setCacheLoaded(false);
    setMessages([]);
    setUserCount(0);

    const loadCachedMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(storageKey);
        if (!isMounted) return;

        if (!savedMessages) {
          setMessages([]);
          return;
        }

        const parsedMessages: unknown = JSON.parse(savedMessages);
        if (!Array.isArray(parsedMessages)) {
          setMessages([]);
          return;
        }

        const normalizedMessages = parsedMessages
          .map((message) => normalizeMessage(message as IncomingChatMessage))
          .filter((message): message is ChatMessageItem => message !== null);

        setMessages(mergeMessageList(normalizedMessages));
      } catch (error) {
        console.warn("Failed to load live chat cache", error);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) {
          setCacheLoaded(true);
        }
      }
    };

    loadCachedMessages();

    return () => {
      isMounted = false;
    };
  }, [roomId, storageKey]);

  useEffect(() => {
    if (!cacheLoaded) return;

    AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch((error) =>
      console.warn("Failed to persist live chat cache", error),
    );
  }, [cacheLoaded, messages, storageKey]);

  useEffect(() => {
    if (!cacheLoaded) return;

    void syncHistory();
  }, [cacheLoaded, syncHistory]);

  useEffect(() => {
    if (!cacheLoaded) return;

    setIsReady(false);

    let isMounted = true;
    let socket: GameChatSocket | null = null;

    const connectSocket = async () => {
      const token = await getAccessToken();

      if (!isMounted) return;

      if (!token || !SOCKET_URL) {
        setIsReady(false);
        return;
      }

      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        auth: { token },
        reconnection: true,
      });

      socketRef.current = socket;

      const handleConnect = () => {
        socket?.emit("joinGame", roomId);
        setIsReady(true);
        void syncHistory();
      };

      const handleDisconnect = () => {
        setIsReady(false);
      };

      const handleReceiveMessage = (message: IncomingChatMessage) => {
        upsertMessage(message);
      };

      const handleReactionUpdated = (payload: GameChatReactionUpdate) => {
        if (payload.gameId !== roomId) return;

        applyReactionUpdate(payload);
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("receiveMessage", handleReceiveMessage);
      socket.on("reactionUpdated", handleReactionUpdated);
      socket.on("userCount", setUserCount);
      socket.on("connect_error", (error) => {
        console.warn("Game chat socket connection failed", error.message);
      });
    };

    connectSocket();

    return () => {
      isMounted = false;

      if (socket) {
        socket.emit("leaveGame", roomId);
        socket.disconnect();
      }

      socketRef.current = null;
      setIsReady(false);
    };
  }, [applyReactionUpdate, cacheLoaded, roomId, syncHistory, upsertMessage]);

  const sendMessage = useCallback(
    (sendPayload: ChatSendPayload) => {
      const payload = buildChatPayload(
        sendPayload.text ?? "",
        sendPayload.gifUrl,
      );
      const socket = socketRef.current;
      if (!payload || !socket?.connected) return false;

      const now = Date.now();
      const sendKey = createSendPayloadKey(payload);
      const recentSend = recentSendRef.current;

      if (
        recentSend?.key === sendKey &&
        now - recentSend.time < DUPLICATE_SEND_BLOCK_MS
      ) {
        return false;
      }

      const message = createClientMessage(payload, {
        userName: currentUserName,
        profileImage: currentUserProfileImage,
        gameId: roomId,
        now,
      });

      if (!message) return false;

      recentSendRef.current = { key: sendKey, time: now };
      upsertMessage(message);

      socket.emit(
        "sendMessage",
        {
          gameId: roomId,
          clientId: message.clientId ?? message.id,
          text: payload.text,
          gifUrl: payload.gifUrl,
        },
        (response) => {
          if (response.ok) {
            upsertMessage(response.message);
            return;
          }

          console.warn("Game chat message rejected", response.error);
          removeOptimisticMessage(message.clientId ?? message.id);
        },
      );

      return true;
    },
    [
      currentUserName,
      currentUserProfileImage,
      removeOptimisticMessage,
      roomId,
      upsertMessage,
    ],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      const socket = socketRef.current;
      const targetMessage = messages.find(
        (message) => message.id === messageId || message.clientId === messageId,
      );

      if (
        !socket?.connected ||
        !targetMessage ||
        targetMessage.id === targetMessage.clientId
      ) {
        return;
      }

      const canonicalMessageId = targetMessage.id;

      setMessages((prevMessages) => {
        const messageIndex = prevMessages.findIndex(
          (message) =>
            message.id === canonicalMessageId ||
            message.clientId === canonicalMessageId,
        );

        if (messageIndex === -1) return prevMessages;

        const nextMessages = [...prevMessages];
        const message = nextMessages[messageIndex];
        const reactions = { ...(message.reactions ?? {}) };
        const users = reactions[emoji] ?? [];

        reactions[emoji] = users.includes(currentUserName)
          ? users.filter((userName) => userName !== currentUserName)
          : [...users, currentUserName];

        nextMessages[messageIndex] = {
          ...message,
          reactions,
        };

        return nextMessages;
      });

      socket.emit(
        "toggleReaction",
        { messageId: canonicalMessageId, emoji },
        (response) => {
          if (response.ok) {
            applyReactionUpdate(response);
            return;
          }

          console.warn("Game chat reaction rejected", response.error);
          void syncHistory();
        },
      );
    },
    [applyReactionUpdate, currentUserName, messages, syncHistory],
  );

  return {
    messages,
    userCount,
    currentUserName,
    isReady,
    sendMessage,
    addReaction,
  };
}
